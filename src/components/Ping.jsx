import { nanoid } from 'nanoid';
import { useEffect, useState } from 'react';
import './Ping.css';
const ping = require('web-pingjs');

// Define the regions to check.
const AWS_REGIONS = {
    "us-east-1": "ec2.us-east-1.amazonaws.com",
    "us-west-1": "ec2.us-west-1.amazonaws.com",
    "ap-southeast-1": "ec2.ap-southeast-1.amazonaws.com",
    "us-west-2": "ec2.us-west-2.amazonaws.com",
    "sa-east-1": "ec2.sa-east-1.amazonaws.com",
    "eu-central-1": "ec2.eu-central-1.amazonaws.com",
    "eu-west-1": "ec2.eu-west-1.amazonaws.com",
    "ap-northeast-1": "ec2.ap-northeast-1.amazonaws.com",
    "ap-southeast-2": "ec2.ap-southeast-2.amazonaws.com"
};
const PING_INTERVAL = 10;

const regionsMap = {
    "us-east-1": "US East (N. Virginia) (us-east-1)",
    "us-east-2": "US East (Ohio) (us-east-2)",
    "us-west-1": "US West (N. California) (us-west-1)",
    "us-west-2": "US West (Oregon) (us-west-2)",
    "af-south-1": "Africa (Cape Town) (af-south-1)",
    "ap-south-1": "Asia Pacific (Mumbai) (ap-south-1)",
    "ap-northeast-2": "Asia Pacific (Seoul) (ap-northeast-2)",
    "ap-southeast-1": "Asia Pacific (Singapore) (ap-southeast-1)",
    "ap-southeast-2": "Asia Pacific (Sydney) (ap-southeast-2)",
    "ap-northeast-1": "Asia Pacific (Tokyo) (ap-northeast-1)",
    "ca-central-1": "Canada (Central) (ca-central-1)",
    "eu-central-1": "Europe (Frankfurt) (eu-central-1)",
    "eu-west-1": "Europe (Ireland) (eu-west-1)",
    "eu-west-2": "Europe (London) (eu-west-2)",
    "eu-south-1": "Europe (Milan) (eu-south-1)",
    "eu-west-3": "Europe (Paris) (eu-west-3)",
    "eu-north-1": "Europe (Stockholm) (eu-north-1)",
    "sa-east-1": "South America (São Paulo) (sa-east-1)"
};

const Ping = () => {
    const [pingResults, setPingResults] = useState({});
    const [latencyResults, setLatencyResults] = useState({});

    const addPingResult = (url, time) => {
        setPingResults(pingResults => {
            const newPingResults = { ...pingResults };

            if (newPingResults[url])
                newPingResults[url].push(time);
            else
                newPingResults[url] = [time];

            return newPingResults;
        });
    }

    const checkLatency = (url) => {
        ping(url).then(function (delta) {
            // console.log('Ping time was ' + String(delta) + ' => ' + url);
            addPingResult(url, delta);
        }).catch(function (err) {
            console.error('Could not ping remote URL', err);
        });
    }

    const cloudPingTest = (list) => {
        list.map(url => {
            checkLatency(url);
        })
    }

    const startPingTest = (times) => {
        const pingRegions = Object.values(AWS_REGIONS);

        for (let i = 0; i < times; i++)
            cloudPingTest(pingRegions)
    }

    const calculateLatency = () => {

    }

    useEffect(() => {
        const results = Object.values(pingResults);

        if (results.every(item => item.length == PING_INTERVAL))
            calculateLatency();
    }, [pingResults])

    useEffect(() => {
        startPingTest(PING_INTERVAL);
    }, [])

    return (
        <div className='region-test'>
            <div className='d-flex'>
                <h4 className='header-title icon-heading-w'>Media Region Test</h4>
                <div className='refresh-icon'>
                    <img src='../images/Refresh_icon.png' alt='' />
                    <span className='tooltiptext'>Refresh</span>
                </div>
            </div>
            <p>Latency ping test tool. Tests across various AWS Media Regions across the globe. Help user pick the most optimal media region.</p>
            <div className='row m-t-20'>
                {
                    Object.values(regionsMap).map((region, index) =>
                        <div className='col-md-4' key={nanoid()}>
                            <div className='green-border'>
                                <span className='number'>
                                    {index + 1}
                                </span>
                                <div className='recomend'>
                                    {/* <Recommended /> */}
                                </div>
                                <div className='region-sec'>
                                    <div className='region-img'>
                                        <img src='../images/flag-round-250.png' alt='' />
                                    </div>
                                    <div className='region-name'>
                                        {region}
                                    </div>
                                </div>
                                <div className='latency'>
                                    Latency(in ms)
                                    <span>225
                                    </span>
                                </div>
                                <span className='count-no'>{PING_INTERVAL}</span>
                            </div>
                        </div>
                    )
                }
            </div>
        </div>
    )
}

export default Ping