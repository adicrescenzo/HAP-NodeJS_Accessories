var Accessory = require('../').Accessory;
var Service = require('../').Service;
var Characteristic = require('../').Characteristic;
var uuid = require('../').uuid;
var mqtt = require('mqtt');
var MQTT_IP = 'localhost' //change this if your MQTT broker is different
var mqttMSG = false;
var debug = require('debug')('Piantana');

var name = "Piantana Piccola"; //accessory name
var sonoffUUID = "hap-nodejs:accessories:sonoff:floorlampsmall"; //change this to your preferences
var sonoffUsername = "AA:BB:CC:DD:EE:00";;
var MQTT_NAME = 'livingroomfloorlights' //MQTT topic that was set on the Sonoff firmware


var options = {
  port: 1883,
  host: MQTT_IP,
  clientId: MQTT_NAME+'HAP'
};
var sonoffTopic = 'cmnd/'+MQTT_NAME+'/power2';
var client = mqtt.connect(options);

client.on('message', function(topic, message) {
  debug('[%s] Message received: {Topic: [%s], Message: [%s]', new Date(), name, topic.toString(), message.toString());
  message = message.toString();
  mqttMSG = true;
  if (message.includes('ON')){
    sonoffObject.powerOn = true;
  }
  else{
    sonoffObject.powerOn = false;
  }
  sonoff
    .getService(Service.Outlet)
    .setCharacteristic(Characteristic.On,sonoffObject.powerOn);
});

client.on('connect', function () {
  client.subscribe('stat/'+MQTT_NAME+'/POWER2');
});

var sonoffObject = {
  powerOn: false,
  setPowerOn: function(on) {
    sonoffObject.powerOn = on;
    if (on) {
      debug('[%s] Set Power ON', name);
      client.publish(sonoffTopic, 'on');
    } else {
      debug('[%s] Set Power OFF', name);
      client.publish(sonoffTopic, 'off');
    }
  },
  identify: function() {
    debug('[%s] Identified!', name);
  }
}

var sonoff = exports.accessory = new Accessory(name, uuid.generate(sonoffUUID));

sonoff.username = sonoffUsername;
sonoff.pincode = "123-45-678";

// listen for the "identify" event for this Accessory
sonoff.on('identify', function(paired, callback) {
  sonoffObject.identify();
  callback();
});

sonoff
  .addService(Service.Outlet, name)
  .getCharacteristic(Characteristic.On)
  .on('set', function(value, callback) {
    debug("[%s] Set [%s]", name, value);
    if(mqttMSG){
      mqttMSG = false;
      callback();
    }
    else {
      sonoffObject.setPowerOn(value);
      callback();
    }
  });

sonoff
  .getService(Service.Outlet)
  .getCharacteristic(Characteristic.On)
  .on('get', function(callback) {
    debug("[%s] Get [%s]", name, sonoffObject.powerOn);
    client.publish(sonoffTopic,'')
    callback(undefined, sonoffObject.powerOn);
  });
