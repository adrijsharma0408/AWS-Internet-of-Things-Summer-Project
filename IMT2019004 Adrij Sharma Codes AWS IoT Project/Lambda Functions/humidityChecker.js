const aws = require('aws-sdk');
var sns = new aws.SNS()

exports.handler = async (event) => {
    var humidityLevel = event.humidity;
    if(humidityLevel > 50) {
        sendSNS("Humidity level has increased and it is time to close the valve");
        turnOff("valve");
    }
    if(humidityLevel < 50) {
        sendSNS("Moderate Humidity level. Valve re-opened");
        turnOn("valve");
    }
};

function sendSNS(message) {
    var payload = {
        Message: message,
        Subject: 'IIoT Notification',
        TopicArn: 'arn:aws:sns:us-east-2:689488846745:humidityTopic'
    };
    sns.publish(payload).promise();
}

async function turnOn(deviceName) {
    var iotdata = new aws.IotData({ endpoint: 'a3hvn9uchylscb-ats.iot.us-east-2.amazonaws.com'});
    var topicName = '$aws/things/' + deviceName + '/shadow/update';
    var dataToBeSent = {
        "state": {
            "desired": {
                "valve": true
            }
        }
    };
    var content = {
        topic: topicName,
        payload: JSON.stringify(dataToBeSent),
        qos: 1
    };
    await iotdata.publish(content, function(err, data){
        if (err) {
            console.log("ERROR => " + JSON.stringify(err));
        }
        else {
            console.log("Success");
        }
    }).promise();
}

async function turnOff(deviceName) {
    var iotdata = new aws.IotData({ endpoint: 'a3hvn9uchylscb-ats.iot.us-east-2.amazonaws.com'});
    var topicName = '$aws/things/' + deviceName + '/shadow/update';
    var dataToBeSent = {
        "state": {
            "desired": {
                "valve": false
            }
        }
    };
    var content = {
        topic: topicName,
        payload: JSON.stringify(dataToBeSent),
        qos: 1
    };
    await iotdata.publish(content, function(err, data){
        if (err) {
            console.log("ERROR => " + JSON.stringify(err));
        }
        else {
            console.log("Success");
        }
    }).promise();
}