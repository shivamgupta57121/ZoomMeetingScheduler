const puppeteer = require("puppeteer");
let { email, password } = require("../secret");
let setCookies = [];
setCookies = require("../cookies");
let { meeting } = require("./meeting")
var fs = require("fs");

async function letsWait() {
    let random = Math.floor(Math.random() * 1000 + 200);

    return new Promise((res, rej) => {
        setTimeout(() => {
            res();
        }, random);
    });
}

async function waitAndClick(selector, newTab) {
    await newTab.waitForTimeout(3000);
    await newTab.waitForSelector(selector, { visible: true });
    // not wait for this promise since we want calling function to await this promise
    let selectorClickPromise = newTab.click(selector);
    return selectorClickPromise;
}

(async function () {
    let browser = await puppeteer.launch({
        headless: false,
        defaultViewport: false,
        args: ["--start-maximized"],
    });

    let pages = await browser.pages();

    let tab = pages[0];
    for (let i = 0; i < setCookies.length; i++) {
        await tab.setCookie(setCookies[i]);
    }
    await tab.goto("https://zoom.us/signin");

    // //   first time login page for new user
    // await tab.type("input[type='email']", email, { delay: 200 });
    // await letsWait();
    // await tab.type("input[type='password']", password, { delay: 200 });
    // await letsWait();
    // await tab.click(".btn.btn-primary.signin.user");
    // await tab.waitForNavigation({ waitUntil: "networkidle2", timeout: 600000 });
    // let cookiePage = await tab.cookies();
    // console.log('these are the cookies of the current page ', cookiePage);
    // await letsWait();
    // fs.writeFileSync("a.js", JSON.stringify(cookiePage));

    console.log("Login done using cookies");
    await waitAndClick(".schedule-meeting", tab);
    let url = tab.url();
    for(let i = 0 ; i < meeting.length ; i++){
        var startTime = meeting[i].startTime;
        var amOrPm = meeting[i].amOrPm;
        var durationHour = meeting[i].durationHour;
        var durationMin = meeting[i].durationMin;
        var topic = meeting[i].topic;
        await meetingScheduler(url, startTime, amOrPm, durationHour, durationMin, topic, tab);
    }

})();

async function meetingScheduler(meetingSchdulerPageUrl, start, amOrPm, durationHRS, durationMin, topic, tab){
    
    await tab.goto(meetingSchdulerPageUrl);
    // console.log("sch meet");
    await tab.waitForSelector("input[name='topic']", { visible: true });
    await tab.type("input[name='topic']", topic, { delay: 200 })

    // click start time
    await waitAndClick("input[aria-controls='start_time-popup-list']", tab);
    var startTimeArr = start.split(":");
    // console.log(startTimeArr[0],startTimeArr[1]);
    var val = (parseInt(startTimeArr[0])*2)%24;
    if (startTimeArr[1] == "30") val++;
    var startTimeSelector = "#select-item-start_time-" + val;
    await waitAndClick(startTimeSelector, tab);

    // click the AM - PM
    await waitAndClick("span[aria-controls='start_time_2-popup-list']", tab);
    if (amOrPm == "AM") {
        await waitAndClick("#select-item-start_time_2-0", tab);
    } else {
        await waitAndClick("#select-item-start_time_2-1", tab);
    }

    // click the hr
    await waitAndClick("span[aria-controls='duration_hr-popup-list']", tab);
    var selector = "#select-item-duration_hr-" + durationHRS;
    await waitAndClick(selector, tab);

    // click the minutes 
    await waitAndClick("span[aria-controls='duration_min-popup-list']", tab);
    if (durationMin == "00") {
        await waitAndClick("#select-item-duration_min-0", tab);
    } else if (durationMin == "15") {
        await waitAndClick("#select-item-duration_min-1", tab);
    } else if (durationMin == "30") {
        await waitAndClick("#select-item-duration_min-2", tab);
    } else {
        await waitAndClick("#select-item-duration_min-3", tab);
    }

    // click mute participants
    await waitAndClick("input[name='option_mute_upon_entry']", tab);
    // click save meeting
    return waitAndClick("#meetingSaveButton", tab);

}