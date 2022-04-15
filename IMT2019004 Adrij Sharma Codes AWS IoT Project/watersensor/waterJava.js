// Publish Data from car devices - iot.js

/*
* Copyright 2010-2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
*
* Licensed under the Apache License, Version 2.0 (the "License").
* You may not use this file except in compliance with the License.
* A copy of the License is located at
*
*  http://aws.amazon.com/apache2.0
*
* or in the "license" file accompanying this file. This file is distributed
* on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
* express or implied. See the License for the specific language governing
* permissions and limitations under the License.
*/

// Require AWS IoT Device SDK
const awsIoT = require('aws-iot-device-sdk');

// Require crypto for random numbers generation
const crypto = require('crypto');

// Load the endpoint from file
const endpointFile = require('/home/ec2-user/environment/endpoint.json');

// Fetch the deviceName from the folder name
const deviceName = __dirname.split('/').pop();

// Create the thingShadow object with argument data
const device = awsIoT.device({
   keyPath: 'private.pem.key',
  certPath: 'certificate.pem.crt',
    caPath: '/home/ec2-user/environment/root-CA.crt',
  clientId: deviceName,
      host: endpointFile.endpointAddress
});

// Function that gets executed when the connection to IoT is established
device.on('connect', function() {
    console.log('Connected to AWS IoT');
    
    // Start the publish loop
    infiniteLoopPublish();
});

// Function sending car telemetry data every 5 seconds
function infiniteLoopPublish() {
    console.log('Sending humidity data to AWS IoT for ' + deviceName);
    // Publish car data to lab/telemetry topic with getCarData
    device.publish("lab/telemetry", JSON.stringify(getCarData(deviceName)));
    
    // Start Infinite Loop of Publish every 5 seconds
    setTimeout(infiniteLoopPublish, 10000);
}

// Function to create a random float between minValue and maxValue
function randomFloatBetween(minValue,maxValue){
    return parseFloat(Math.min(minValue + (Math.random() * (maxValue - minValue)),maxValue));
}

// Generate random car data based on the deviceName
function getCarData(deviceName) {
    let message = {
        'humidity': randomFloatBetween(0, 100)
    };
    
    const device_data = { 
        'watersensor': {
            'vin': 'I5Z45ZSGBRZFU4YRM'
        },
        'valve': {
            'vin': 'ETWUASOOGRZOPQRTR'
        }
    };
  
    message['vin'] = device_data[deviceName].vin;
    message['device'] = deviceName;
    message['datetime'] = new Date().toISOString().replace(/\..+/, '');
    
    return message;
}