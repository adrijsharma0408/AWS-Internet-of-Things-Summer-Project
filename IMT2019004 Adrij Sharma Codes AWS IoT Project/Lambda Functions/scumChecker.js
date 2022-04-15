const aws = require('aws-sdk');
var sns = new aws.SNS()

exports.handler = async (event) => {
    var scumLevel = event.scum;
    if(scumLevel > 50) {
        sendSNS("Scum level has increased and it is time to close the 2nd valve");
        turnOff("valve2");
    }
    if(scumLevel < 50) {
        sendSNS("Moderate scum level. Valve2 re-opened");
        turnOn("valve2");
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
                "valve2": true
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
                "valve2": false
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