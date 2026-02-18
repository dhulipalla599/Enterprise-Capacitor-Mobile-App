package com.example.iot;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "MeterPlugin")
public class MeterPlugin extends Plugin {
    @PluginMethod
    public void readMeterValue(PluginCall call) {
        String meterId = call.getString("meterId");
        if (meterId == null) {
            call.reject("meterId is required");
            return;
        }

        JSObject result = new JSObject();
        result.put("value", 342.5);
        result.put("timestamp", System.currentTimeMillis() / 1000);
        result.put("unit", "kWh");
        result.put("meterId", meterId);
        
        call.resolve(result);
    }
}
