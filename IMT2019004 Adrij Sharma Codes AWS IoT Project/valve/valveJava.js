// Register to Thing Shadow and act on light status

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

// Load the endpoint from file
const endpointFile = require('/home/ec2-user/environment/endpoint.json');

// Fetch the thingName from the folder name
const thingName = __dirname.split('/').pop();

// Initial Get Client Token
let initialGetClientToken;

// Initial state of car
const initialState = {
    state: { 
        reported: { 
            lights: false
        }, 
        desired: null 
    }
};

// Create the thingShadow object with argument data
const thingShadows = awsIoT.thingShadow({
   keyPath: 'private.pem.key',
  certPath: 'certificate.pem.crt',
    caPath: '/home/ec2-user/environment/root-CA.crt',
  clientId: thingName,
      host: endpointFile.endpointAddress
});

// Register/Subscribe to the thingShadow topic
thingShadows.register(thingName, {}, function(err, failedTopics) {
    if (isUndefined(err) && isUndefined(failedTopics)) {
        console.log('The ' + thingName + ' has been registered.\r\nSending initial get to set the light state.');
        initialGetClientToken = thingShadows.get(thingName);
    }
});

// On delta generated by IoT
thingShadows.on('delta', function(thingName, stateObject) {
    
    // If the lights attribute was modified, call the outputLightState function
    if (!isUndefined(stateObject.state.lights)) {
        outputLightState(stateObject.state.lights);
    }
    
    // Report to the Shadow the new state
    console.log('Reporting my new state.');
    thingShadows.update(thingName, { state: { reported: stateObject.state, desired: null } } );
});


// Function outputting the state of the car
function outputLightState(lights) {
    if (lights) {
        console.log('Valve is ON');
    } else {
        console.log('Valve is OFF');
    }
}

// Function to look for undefined values
function isUndefined(value) {
    return typeof value === 'undefined' || value === null;
}

// On status when a get/update/delete is received
thingShadows.on('status', function(thingName, statusType, clientToken, stateObject) {
    
    // Resolving the initial state status. There could be no state, a delta state or a reported state
    
    // If the clientToken is for our initial Get request and the status is rejected
    //  this means that the Thing Shadow has been deleted. We need to set the state to defaults
    if (initialGetClientToken === clientToken && statusType === 'rejected') {
        
        setDefaultState();
    }
    
    // If the clientToken is for our initial Get request and the status is accepted
    //  this means that there is a Shadow, but it may be empty
    if (initialGetClientToken === clientToken && statusType === 'accepted') {
        console.log('Received the initial get data.');
        
        // If the Thing Shadow is empty, set the state to defaults
        if (Object.keys(stateObject.state).length == 0) {
            setDefaultState();
        } 
        // Else if there is a delta state, resolve it
        else if (stateObject.state.hasOwnProperty('delta')) {
            console.log('Delta found on initial get setting lights to that state and reporting.');
            
            // If the lights attribute was modified, call the outputLightState function
            if (!isUndefined(stateObject.state.delta.lights)) {
                outputLightState(stateObject.state.delta.lights);
            }
            
            // Report to the Shadow the new state
            thingShadows.update(thingName, { state: { reported: stateObject.state.delta, desired: null } } );
            
        } else {
            // If the state isn't empty and there is no delta, there is a reported state
            
            // If the lights attribute has been reported
            if (stateObject.state.reported.hasOwnProperty('lights')) {
                
                // A previously reported state has been found (probably from the previous run), set the state to that
                console.log('Found a previously reported state, setting my lights to that');
                outputLightState(stateObject.state.reported.lights);
            } else {
                
                // Else, we need to set the state to defaults
                setDefaultState();
            }
        }
    }
});

// Unregister the Shadow if the connection closes
thingShadows.on('close', function() {
    console.log('The connection has been closed. Deregistering the Thing Shadow.');
      thingShadows.unregister(thingName);
});

// Set the state to defaults
function setDefaultState() {
    console.log('No valve state found, setting state to defaults.');
    thingShadows.update(thingName, initialState);
    outputLightState(initialState.state.reported.lights);
}