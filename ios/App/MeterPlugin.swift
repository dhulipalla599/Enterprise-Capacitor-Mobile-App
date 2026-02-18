// ios/App/MeterPlugin.swift
// Custom Capacitor plugin for PG&E smart meter SDK integration

import Foundation
import Capacitor

@objc(MeterPlugin)
public class MeterPlugin: CAPPlugin {
    private let meterSDK = SmartMeterSDK()
    private var activeReads: [String: Task<Void, Never>] = [:]
    
    override public func load() {
        // Initialize SDK when plugin loads
        do {
            try meterSDK.initialize()
            print("MeterPlugin: SDK initialized")
        } catch {
            print("MeterPlugin: Failed to initialize SDK - \(error.localizedDescription)")
        }
    }
    
    @objc func readMeterValue(_ call: CAPPluginCall) {
        guard let meterId = call.getString("meterId") else {
            call.reject("meterId parameter is required")
            return
        }
        
        // Execute on background queue to avoid blocking UI
        Task {
            do {
                let reading = try await meterSDK.readMeter(id: meterId)
                
                await MainActor.run {
                    call.resolve([
                        "value": reading.kwh,
                        "timestamp": reading.timestamp,
                        "unit": "kWh",
                        "meterId": meterId,
                        "quality": reading.quality.rawValue
                    ])
                }
            } catch let error as MeterSDKError {
                await MainActor.run {
                    call.reject("Failed to read meter: \(error.localizedDescription)", 
                               "\(error.code)")
                }
            } catch {
                await MainActor.run {
                    call.reject("Unknown error reading meter: \(error.localizedDescription)")
                }
            }
        }
    }
    
    @objc func startContinuousRead(_ call: CAPPluginCall) {
        guard let meterId = call.getString("meterId") else {
            call.reject("meterId parameter is required")
            return
        }
        
        let intervalSeconds = call.getInt("intervalSeconds") ?? 60
        
        // Cancel any existing continuous read for this meter
        activeReads[meterId]?.cancel()
        
        // Start continuous read task
        let task = Task {
            while !Task.isCancelled {
                do {
                    let reading = try await meterSDK.readMeter(id: meterId)
                    
                    // Notify via event
                    await MainActor.run {
                        self.notifyListeners("meterReading", data: [
                            "meterId": meterId,
                            "value": reading.kwh,
                            "timestamp": reading.timestamp,
                            "unit": "kWh",
                            "quality": reading.quality.rawValue
                        ])
                    }
                    
                    // Wait for interval
                    try await Task.sleep(nanoseconds: UInt64(intervalSeconds) * 1_000_000_000)
                    
                } catch is CancellationError {
                    break
                } catch {
                    print("Continuous read error: \(error.localizedDescription)")
                    try? await Task.sleep(nanoseconds: 5_000_000_000) // Wait 5s on error
                }
            }
        }
        
        activeReads[meterId] = task
        call.resolve(["status": "started", "meterId": meterId])
    }
    
    @objc func stopContinuousRead(_ call: CAPPluginCall) {
        guard let meterId = call.getString("meterId") else {
            call.reject("meterId parameter is required")
            return
        }
        
        activeReads[meterId]?.cancel()
        activeReads.removeValue(forKey: meterId)
        
        call.resolve(["status": "stopped", "meterId": meterId])
    }
    
    @objc func getMeterInfo(_ call: CAPPluginCall) {
        guard let meterId = call.getString("meterId") else {
            call.reject("meterId parameter is required")
            return
        }
        
        Task {
            do {
                let info = try await meterSDK.getMeterInfo(id: meterId)
                
                await MainActor.run {
                    call.resolve([
                        "meterId": info.id,
                        "model": info.model,
                        "firmware": info.firmwareVersion,
                        "installDate": info.installDate.timeIntervalSince1970,
                        "location": [
                            "latitude": info.location.latitude,
                            "longitude": info.location.longitude
                        ],
                        "capabilities": info.capabilities.map { $0.rawValue }
                    ])
                }
            } catch {
                await MainActor.run {
                    call.reject("Failed to get meter info: \(error.localizedDescription)")
                }
            }
        }
    }
    
    @objc func scanForMeters(_ call: CAPPluginCall) {
        let radiusMeters = call.getInt("radiusMeters") ?? 100
        
        Task {
            do {
                let meters = try await meterSDK.scanForMeters(radius: Double(radiusMeters))
                
                let meterData = meters.map { meter in
                    return [
                        "meterId": meter.id,
                        "signalStrength": meter.signalStrength,
                        "distance": meter.estimatedDistance,
                        "model": meter.model
                    ]
                }
                
                await MainActor.run {
                    call.resolve([
                        "meters": meterData,
                        "count": meters.count
                    ])
                }
            } catch {
                await MainActor.run {
                    call.reject("Failed to scan for meters: \(error.localizedDescription)")
                }
            }
        }
    }
    
    deinit {
        // Cancel all active reads when plugin is destroyed
        activeReads.values.forEach { $0.cancel() }
    }
}

// MARK: - Mock SDK for demonstration
// In production, this would be replaced with actual proprietary SDK

private class SmartMeterSDK {
    func initialize() throws {
        // Initialize hardware connection
    }
    
    func readMeter(id: String) async throws -> MeterReading {
        // Simulate network/bluetooth read
        try await Task.sleep(nanoseconds: 500_000_000) // 500ms
        
        return MeterReading(
            kwh: Double.random(in: 300...400),
            timestamp: Date().timeIntervalSince1970,
            quality: .good
        )
    }
    
    func getMeterInfo(id: String) async throws -> MeterInfo {
        return MeterInfo(
            id: id,
            model: "SmartMeter Pro 3000",
            firmwareVersion: "2.1.4",
            installDate: Date(),
            location: (latitude: 37.7749, longitude: -122.4194),
            capabilities: [.realTimeReading, .remoteControl, .eventLogging]
        )
    }
    
    func scanForMeters(radius: Double) async throws -> [DiscoveredMeter] {
        try await Task.sleep(nanoseconds: 2_000_000_000) // 2s
        
        return [
            DiscoveredMeter(id: "MTR-001", signalStrength: -45, estimatedDistance: 15.0, model: "Pro 3000"),
            DiscoveredMeter(id: "MTR-002", signalStrength: -67, estimatedDistance: 45.0, model: "Pro 3000"),
        ]
    }
}

private struct MeterReading {
    let kwh: Double
    let timestamp: Double
    let quality: ReadingQuality
}

private enum ReadingQuality: String {
    case good, degraded, poor
}

private struct MeterInfo {
    let id: String
    let model: String
    let firmwareVersion: String
    let installDate: Date
    let location: (latitude: Double, longitude: Double)
    let capabilities: [MeterCapability]
}

private enum MeterCapability: String {
    case realTimeReading
    case remoteControl
    case eventLogging
    case demandResponse
}

private struct DiscoveredMeter {
    let id: String
    let signalStrength: Int
    let estimatedDistance: Double
    let model: String
}

private enum MeterSDKError: Error {
    case connectionFailed
    case timeout
    case invalidResponse
    case unauthorized
    
    var code: Int {
        switch self {
        case .connectionFailed: return 1001
        case .timeout: return 1002
        case .invalidResponse: return 1003
        case .unauthorized: return 1004
        }
    }
}
