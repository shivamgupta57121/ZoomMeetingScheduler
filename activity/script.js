let puppeteer = require("puppeteer");
let { email, password } = require("../secret");
let setCookies = [];
setCookies = require("../cookies");
let { meeting } = require("./meeting")
let fs = require("fs");

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

function blockingWait(seconds) {
    //simple blocking technique (wait...)
    let waitTill = new Date(new Date().getTime() + seconds * 1000);
    while(waitTill > new Date()){}

}

(async function () {
    let browser = await puppeteer.launch({
        headless: false,
        defaultViewport: false,
        args: ["--start-maximized"],
    });

    let pages = await browser.pages();
    let zoomTab = pages[0];
    for (let i = 0; i < setCookies.length; i++) {
        await zoomTab.setCookie(setCookies[i]);
    }
    await zoomTab.goto("https://zoom.us/signin");

    // //   first time login page for new user
    // await zoomTab.type("input[type='email']", email, { delay: 200 });
    // await letsWait();
    // await zoomTab.type("input[type='password']", password, { delay: 200 });
    // await letsWait();
    // await zoomTab.click(".btn.btn-primary.signin.user");
    // await zoomTab.waitForNavigation({ waitUntil: "networkidle2", timeout: 600000 });
    // let cookiePage = await zoomTab.cookies();
    // console.log('these are the cookies of the current page ', cookiePage);
    // await letsWait();
    // fs.writeFileSync("cookies.js", JSON.stringify(cookiePage));

    console.log("Login done using cookies");
    await waitAndClick(".schedule-meeting", zoomTab);
    let url = zoomTab.url();

    let gmailTab = await browser.newPage();
    let gmailUrl = "https://accounts.google.com/ServiceLogin/identifier?service=mail&passive=true&rm=false&continue=https%3A%2F%2Fmail.google.com%2Fmail%2F&ss=1&scc=1&ltmpl=default&ltmplcache=2&emr=1&osid=1&flowName=GlifWebSignIn&flowEntry=ServiceLogin"
    await gmailTab.goto(gmailUrl);
    await gmailTab.type("input[type='email']", "codethefame", { delay: 200 });
    await gmailTab.click("span[jsname='V67aGc']");
    await gmailTab.waitForTimeout(3000);
    await gmailTab.type(".whsOnd.zHQkBf", "MnbvcxZ!", { delay: 200 });
    await gmailTab.click("span[jsname='V67aGc']");

    for (let i = 0; i < meeting.length; i++) {
        let startTime = meeting[i].startTime;
        let amOrPm = meeting[i].amOrPm;
        let durationHour = meeting[i].durationHour;
        let durationMin = meeting[i].durationMin;
        let topic = meeting[i].topic;
        let batchEmail = meeting[i].batchEmail;
        await meetingScheduler(url, startTime, amOrPm, durationHour, durationMin, topic, batchEmail, zoomTab, gmailTab);
    }
    console.log("success!!!");

})();

async function meetingScheduler(meetingSchdulerPageUrl, start, amOrPm, durationHRS, durationMin, topic, batchEmail, zoomTab, gmailTab) {

    await zoomTab.bringToFront();
    blockingWait(1);
    await zoomTab.goto(meetingSchdulerPageUrl);
    await zoomTab.waitForSelector("input[name='topic']", { visible: true });
    await zoomTab.type("input[name='topic']", topic, { delay: 200 })

    // click start time
    await waitAndClick("input[aria-controls='start_time-popup-list']", zoomTab);
    let startTimeArr = start.split(":");
    let val = (parseInt(startTimeArr[0]) * 2) % 24;
    if (startTimeArr[1] == "30") val++;
    let startTimeSelector = "#select-item-start_time-" + val;
    await waitAndClick(startTimeSelector, zoomTab);

    // click the AM - PM
    await waitAndClick("span[aria-controls='start_time_2-popup-list']", zoomTab);
    if (amOrPm == "AM") {
        await waitAndClick("#select-item-start_time_2-0", zoomTab);
    } else {
        await waitAndClick("#select-item-start_time_2-1", zoomTab);
    }

    // click the hr
    await waitAndClick("span[aria-controls='duration_hr-popup-list']", zoomTab);
    let selector = "#select-item-duration_hr-" + durationHRS;
    await waitAndClick(selector, zoomTab);

    // click the minutes 
    await waitAndClick("span[aria-controls='duration_min-popup-list']", zoomTab);
    let val1 = (parseInt(durationMin) / 15);
    let durationMinSelector = "#select-item-duration_min-" + val1;
    await waitAndClick(durationMinSelector, zoomTab);

    // click save meeting
    await waitAndClick("#meetingSaveButton", zoomTab);
    await waitAndClick("#copyInvitation", zoomTab);
    await waitAndClick(".btn.btn-primary.select-all", zoomTab);

    await gmailTab.bringToFront();
    blockingWait(1);
    await waitAndClick(".T-I.T-I-KE.L3", gmailTab);
    let sub = topic + " Class Link";
    await waitAndClick(".wO.nr.l1",gmailTab);
    await gmailTab.type(".wO.nr.l1", batchEmail, { delay: 200 });
    await gmailTab.click("input[name='subjectbox']");
    await gmailTab.type("input[name='subjectbox']", sub, { delay: 200 });
    await gmailTab.click("div[aria-label='Message Body']");
    await gmailTab.type("div[aria-label='Message Body']", "Greetings, ", { delay: 200 });
    await gmailTab.keyboard.down("Control");
    await gmailTab.keyboard.press("V");
    await gmailTab.keyboard.up("Control");
    await gmailTab.type("div[aria-label='Message Body']", "Thanks & Regards", { delay: 200 });
    await gmailTab.keyboard.down("Control");
    await gmailTab.keyboard.press("Enter");
    return gmailTab.keyboard.up("Control");

}