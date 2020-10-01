/* eslint-disable */
// Routes in this module require authentication
const moment =require('moment');
const elancopartner =require( '../server-controllers/elancopartner');
const admin =require( '../server-controllers/admin');
const user =require( '../server-controllers/user');
const SAPBO =require( '../server-controllers/pulldata');
const csvjson =require( '../server-controllers/csv');
// import servicevalue from '../../servicevalue.json';
const express =require( 'express');
const request = require('request');
const auth = require('cirrus-auth-module');
const authorizationService = require('cirr-authorization-module');
const pdf = require('html-pdf');
const fs = require('fs');
const rp = require('request-promise');
const async = require('async');
const CryptoJS = require('crypto-js');
const sanitizer = require('sanitizer');
// const app = express();

// const server = require('http').createServer(app);
// const io = require('socket.io').listen(server);
const router = express.Router();
const { APIURL } = process.env;
const API_URL = process.env.MYEEM_API_URL;
const { JANRAINURL } = process.env;
const { ADGROUPUSERNAME } = process.env;
const { ADGROUPPASSWORD } = process.env;
const ADGROUP = `${ADGROUPUSERNAME}:${ADGROUPPASSWORD}`;
let stringArraysoa = [];
let leaderArraysoa = [];
const reqheadercredential = (new Buffer.from(`${process.env.AUTHAPIUSERNAME}:${process.env.AUTHAPIPASSWORD}`).toString('base64'));
const apiusername = process.env.MYEEM_API_USERNAME;
const apipassword = process.env.MYEEM_API_PASSWORD;
const apiauth = `Basic ${Buffer.from(`${apiusername}:${apipassword}`).toString('base64')}`;
const ADGROUPLIST = process.env.ADGROUP;
const groupPatterns = ADGROUPLIST.split(',');
const certificate = {
  hostname: process.env.hostname,
  key: process.env.API_KEY, // This is the private key used, when creating the Certifcate.
  cert: process.env.API_CERT, // This is the client certificate from Venafi.
  passphrase: process.env.API_PASSPHRASE,
};
// var connections=[]
// io.sockets.on('sending file',(file) => {
//   connections.push(file);
//   console.log(file)
//   console.log(' %s sockets is connected', connections.length);
// });

// Value replace function for risk assesment html
function riskPDF(result, riskType, serviceQuestion) {
  try {
    // read html file based on risk type
    let htmlFs = fs.readFileSync('./RiskAssesment.html', 'utf8');
    let serviceReviewHeader = '';
    if (riskType === 'Quality') {
      htmlFs = fs.readFileSync('./RiskAssesment.html', 'utf8');
      serviceReviewHeader = '<b style="border-bottom:2px solid black;">Quality-Service Review</b>';
    } else {
      htmlFs = '';
      htmlFs = fs.readFileSync('./TechnicalRiskAssesment.html', 'utf8');
      serviceReviewHeader = '<b style="border-bottom:2px solid black;">Technical-Service Review</b>';
    }
    console.log('html :', htmlFs);
    console.log('service Question', serviceQuestion);
    let serviceQuestionData = '';
    // service item template to be displayed on pdf
    if (serviceQuestion !== null && serviceQuestion !== undefined && serviceQuestion !== '') {
      if (serviceQuestion.length > 0) {
        // service item table header
        serviceQuestionData += `<tr>
        <td style="width:40%;padding:5px">
          <label style="padding-top:0.5em;width: 100%;overflow: hidden;
                word-break: break-all;font-size:11px;"><b>Service Review Items</b></label>
        </td>
        <td style="width:20%;padding:5px">
          <label style="padding-top:0.5em;width: 100%;overflow: hidden;
                word-break: break-all;font-size:11px;"><b>Rating</b></label>
        </td>
        <td style="width:40%;padding:5px">
          <label style="padding-top:0.5em;width: 100%;overflow: hidden;
                word-break: break-all;font-size:11px;"><b>Comments</b></label>
        </td>
        </tr>`;
        // const serviceReviewHeader = '<b style="border-bottom:2px solid black;">Quality-Service Review</b>';
        htmlFs = htmlFs.replace('{{serviceReviewHeader}}', serviceReviewHeader);
      } else {
        // if service item are not there show header empty
        htmlFs = htmlFs.replace('{{serviceReviewHeader}}', '');
      }
      for (let i = 0; i < serviceQuestion.length; i++) {
        let reviewvalue = serviceQuestion[i].servicereviewrating !== null &&
          serviceQuestion[i].servicereviewrating !== undefined ?
          parseInt(serviceQuestion[i].servicereviewrating, 0) : 0;
        // change service item value based on 0,1,2
        if (reviewvalue === 0) {
          reviewvalue = 5;
        } else if (reviewvalue === 1) {
          reviewvalue = 3;
        } else if (reviewvalue === 2) {
          reviewvalue = 1;
        }
        console.log('service rating ::', serviceQuestion[i].servicereviewrating);
        // list of service item
        serviceQuestionData += `<tr><td style="width:40%;padding:5px;"><label style="padding-top:0.5em;width: 100%;overflow: hidden;word-break: break-all;font-size:11px;">${serviceQuestion[i].serviceitem}</label></td>`;
        // show emoji(smiley) on pdf based on review value (i.e 5-sad, 3-neutral, 1-happy)
        if (reviewvalue === 5) {
          serviceQuestionData += '<td style="width:20%;padding:5px;"><img style="width: 27px;" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAMAAAD04JH5AAAC8VBMVEXuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTHuNTGcEGu1AAAA+nRSTlMAAQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyAhIiMkJSYnKCkqKywtLi8wMTIzNDU2Nzg5Ojs8PT4/QEFCQ0RFRkdISUpLTE1OT1BSU1RVVldYWVpbXF1e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"></td>';
        } else if (reviewvalue === 3) {
          serviceQuestionData += '<td style="width:20%;padding:5px;"><img style="width: 27px;" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAMAAAD04JH5AAAC61BMVEXu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0THu0TH1QMuLAAAA+HRSTlMAAQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyAhIiMkJSYnKCkqKywtLi8wMTIzNDU2Nzg5Ojs8PT4/QEFCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaW1xdXl9gYWJj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"></td>';
        } else {
          serviceQuestionData += '<td style="width:20%;padding:5px;"><img style="width: 27px;" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAMAAAD04JH5AAAC91BMVEUTgQj///8TgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQgTgQjojCQkAAAA/HRSTlMAAAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0+P0BCQ0RFRkdISUpLTE1OT1BRUlNUVVZX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"></td>';
        }
        serviceQuestionData += `<td style="width:40%;padding:5px;">
                                <label style="padding-top:0.5em;width: 100%;overflow: hidden;
                                word-break: break-all;font-size:11px;">${serviceQuestion[i].additionalcomment}</label>
                                </td>
                              </tr>`;
      }
    }
    console.log('html service data:', serviceQuestionData);
    // replace service item data
    htmlFs = htmlFs.replace('{{serviceQuestion}}', serviceQuestionData);
    htmlFs = htmlFs.replace('{{vendorName}}', result.vendorname !== null && result.vendorname !== undefined ? result.vendorname : '');
    console.log('Partner Code', result.isMP);
    let code = '';
    // check if partner code should have 'MP' or 'VN'
    if (result.partnercode !== null && result.partnercode !== undefined) {
      console.log('mp/vn', result.isMP);
      if (result.isMP === 'true') {
        console.log('is mp');
        code = `MP : ${result.partnercode}`;
      } else if (result.isMP === 'false') {
        console.log('is VN');
        code = `VN : ${result.partnercode}`;
      }
    } else {
      code = '';
    }
    htmlFs = htmlFs.replace('{{partnerCode}}', code);
    htmlFs = htmlFs.replace('{{vendorAddress}}', (result.vendoraddress !== null && result.vendoraddress !== undefined ? result.vendoraddress : ''));
    htmlFs = htmlFs.replace('{{hubOversight}}', result.excelgeneral_huboversight !== null && result.excelgeneral_huboversight !== undefined ? result.excelgeneral_huboversight : '');
    htmlFs = htmlFs.replace('{{qualityRisk}}', result.excelquality_risk !== null && result.excelquality_risk !== undefined ? result.excelquality_risk : '');
    htmlFs = htmlFs.replace('{{techRisk}}', result.excelts_technicalrisk !== null && result.excelts_technicalrisk !== undefined ? result.excelts_technicalrisk : '');
    htmlFs = htmlFs.replace('{{overallScore}}', (result.reviewscore === undefined || result.reviewscore === null) ? '' : result.reviewscore);
    htmlFs = htmlFs.replace('{{vendorCity}}', (result.vendorcity === undefined || result.vendorcity === null) ? '' : result.vendorcity);
    htmlFs = htmlFs.replace('{{GMP}}', result.quality_availablecertifications !== null && result.quality_availablecertifications !== undefined ? result.quality_availablecertifications : '');
    console.log(result.quality_qtanotinplace, result.quality_qtasigneddate === '' || result.quality_qtasigneddate === null || result.quality_qtasigneddate === undefined);
    let inYear = 0;
    // check if length of relationship needs to be calculated or not
    if (result.quality_qtanotinplace === 'true' || (result.quality_qtasigneddate === '' || result.quality_qtasigneddate === null || result.quality_qtasigneddate === undefined)) {
      htmlFs = htmlFs.replace('{{lenRelation}}', '');
      console.log('len relation empty');
    } else {
      // length of relationship calculation
      const lenRelationship = Math.abs(new Date(result.quality_qtasigneddate).getTime()
        - new Date().getTime());
      const diffDay = Math.ceil(lenRelationship / (1000 * 60 * 60 * 24));
      inYear = diffDay / 365;
      htmlFs = htmlFs.replace('{{lenRelation}}', `${inYear.toFixed(2)} year`);
      console.log('len relation', inYear.toFixed(2));
    }
    htmlFs = htmlFs.replace('{{regionMnf}}', result.vendorregion !== null && result.vendorregion !== undefined ? result.vendorregion : '');
    htmlFs = htmlFs.replace('{{vendorRegion}}', result.vendorregion !== null && result.vendorregion !== undefined ? result.vendorregion : '');
    htmlFs = htmlFs.replace('{{productType}}', result.ts_mfgtech !== null && result.ts_mfgtech !== undefined ? result.ts_mfgtech : '');
    htmlFs = htmlFs.replace('{{productPlatform}}', result.totalBrand !== null && result.totalBrand !== undefined ? result.totalBrand : '');
    if (result.quality_gqaauditdate !== null && result.quality_gqaauditdate !== undefined && result.quality_gqaauditdate !== '') {
      result.quality_gqaauditdate = moment(new Date(result.quality_gqaauditdate)).format('DD-MMM-YYYY');
      htmlFs = htmlFs.replace('{{EGQCA}}', result.quality_gqaauditdate);
    } else {
      htmlFs = htmlFs.replace('{{EGQCA}}', '');
    }
    htmlFs = htmlFs.replace('{{ProcessRun}}', '');
    htmlFs = htmlFs.replace('{{Variability}}', '');
    // show risk color in pdf based risk level
    if (riskType === 'Quality') {
      if (result.excelquality_risk !== null && result.excelquality_risk !== undefined
        && result.excelquality_risk !== '') {
        if (result.excelquality_risk.toLowerCase() === 'low') {
          htmlFs = htmlFs.replace('{{RiskColor}}', '<div style="background:green;height:inherit;font-size:12px;">Low</div>');
        } else if (result.excelquality_risk.toLowerCase() === 'medium') {
          htmlFs = htmlFs.replace('{{RiskColor}}', '<div style="background:yellow;height:inherit;font-size:12px;">Medium</div>');
        } else if (result.excelquality_risk.toLowerCase() === 'high') {
          htmlFs = htmlFs.replace('{{RiskColor}}', '<div style="background:red;height:inherit;font-size:12px;">High</div>');
        }
      } else {
        // if risk not calculated show no color
        htmlFs = htmlFs.replace('{{RiskColor}}', '<div style="background:white;height:inherit"></div>');
      }
    } else if (result.excelts_technicalrisk !== null && result.excelts_technicalrisk !== undefined
        && result.excelts_technicalrisk !== '') {
      if (result.excelts_technicalrisk.toLowerCase() === 'low') {
        htmlFs = htmlFs.replace('{{RiskColor}}', '<div style="background:green;height:inherit;font-size:12px;">Low</div>');
      } else if (result.excelts_technicalrisk.toLowerCase() === 'medium') {
        htmlFs = htmlFs.replace('{{RiskColor}}', '<div style="background:yellow;height:inherit;font-size:12px;">Medium</div>');
      } else if (result.excelts_technicalrisk.toLowerCase() === 'high') {
        htmlFs = htmlFs.replace('{{RiskColor}}', '<div style="background:red;height:inherit;font-size:12px;">High</div>');
      }
    } else {
      htmlFs = htmlFs.replace('{{RiskColor}}', '<div style="background:white;height:inherit"></div>');
    }
    return htmlFs;
  } catch (e) {
    console.log('pdf error', e);
    return e;
  }
}

function splitUp(arr, n) {
  const rest = arr.length % n;
  let restUsed = rest;
  const partLength = Math.floor(arr.length / n);
  const result = [];

  for (let i = 0; i < arr.length; i += partLength) {
    let end = partLength + i;
    let add = false;

    if (rest !== 0 && restUsed) {
      end++;
      restUsed--;
      add = true;
    }

    result.push(arr.slice(i, end));

    if (add) {
      i++;
    }
  }
  return result;
}

function setfullName(userId, req, res, next) {
  console.log('set full name');
  console.log(userId);
  const SearchURL = `https://soa.lilly.com:8443/EMDM/v2/GWF_Workers?$filter=SystemLogonId eq '${userId}'&$select=SystemLogonId,LastName,FirstName,InternetEmailAddress,StatusCode`;
  const lillysoadetails = {
    key: process.env.API_KEY,
    cert: process.env.API_CERT,
    passphrase: process.env.API_PASSPHRASE,
    url: SearchURL,
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Accept-Charset': 'utf-8',
      'User-Agent': 'my-reddit-client',
      Authorization: `Basic ${new Buffer.from(ADGROUP).toString('base64')}`,
    },
  };
  rp(lillysoadetails).then((response) => {
    if (response) {
      // console.log(response);
      const userdata = JSON.parse(response);
      console.log('response..');
      console.log(userdata);
      for (let j = 0; j < userdata.value.length; j++) {
        // if (data.value[j].StatusCode === '3') {
        const fullname = `${userdata.value[j].FirstName} ${userdata.value[j].LastName}`;
        console.log('FullName of user is :');
        console.log(fullname);
        req.session.fullname = fullname;
        // global.appServer.locals.fullname = fullname;
        console.log(fullname);
        // }
      }
    }
    // return rp(lillysoadetails);
    next();
  });
}

async function fetchUserId(req, res, next) {
  try {
    const usertoken = req.session.passport.user;
    console.log('usertoken :: ', usertoken);
    console.log('usertoken.sub :: ', usertoken.sub);
    const { ELANCOMFGENV } = process.env;
    const data = usertoken.access_token.split('.')[1];
    const decoded = CryptoJS.enc.Base64.parse(data).toString(CryptoJS.enc.Utf8);
    const sub = JSON.parse(decoded);
    console.log('sub :: ', sub);
    const userId = usertoken.sub;
    const email = sub.userPrincipalName;
    console.log('Check userId');
    console.log(userId);
    console.log(email);
    req.params.userId = userId;
    req.session.userid = req.params.userId;
    req.params.email = email;
    authorizationService.getAdGroups(groupPatterns, usertoken.access_token, certificate)
      .then((resp) => {
        if (ELANCOMFGENV === 'DEV') {
          if (resp.simpleGroups.indexOf('MYEEM_DEVMASTERDATASTEWARDS') > -1) {
            req.session.ismasterdatasteward = true;
            req.session.isreadonly = false;
            req.session.isdatasteward = false;
            setfullName(userId, req, res, next);
            console.log('You are part of MYEEM DEV/STG MASTER DATASTEWARDS group!!');
          } else if (resp.simpleGroups.indexOf('MYEEM_DEVDATASTEWARDS') > -1) {
            req.session.ismasterdatasteward = false;
            req.session.isreadonly = false;
            req.session.isdatasteward = true;
            if (req.url.indexOf('adminupdatecm') > -1) {
              res.render('accessdenied', {
                pageaccess: 1,
              });
            } else if (req.url.indexOf('adminupdateproducts') > -1) {
              res.render('accessdenied', {
                pageaccess: 1,
              });
            } else if (req.url.indexOf('adminupdatefields') > -1) {
              res.render('accessdenied', {
                pageaccess: 1,
              });
            } else if (req.url.indexOf('trackreviews') > -1) {
              res.render('accessdenied', {
                pageaccess: 1,
              });
            } else if (req.url.indexOf('manageservicereview') > -1) {
              res.render('accessdenied', {
                pageaccess: 1,
              });
            } else if (req.url.indexOf('createcm') > -1) {
              res.render('accessdenied', {
                pageaccess: 1,
              });
            } else if (req.url.indexOf('updatecm') > -1) {
              res.render('accessdenied', {
                pageaccess: 1,
              });
            } else {
              setfullName(userId, req, res, next);
            }
            console.log('You are part of MYEEM DEV/STG DATASTEWARDS group!!');
          } else if (resp.simpleGroups.indexOf('MYEEM_DEVREADONLY') > -1) {
            req.session.ismasterdatasteward = false;
            req.session.isreadonly = true;
            req.session.isdatasteward = false;
            if (req.url.indexOf('adminupdatecm') > -1) {
              res.render('accessdenied', {
                pageaccess: 1,
              });
            } else if (req.url.indexOf('adminupdateproducts') > -1) {
              res.render('accessdenied', {
                pageaccess: 1,
              });
            } else if (req.url.indexOf('adminupdatefields') > -1) {
              res.render('accessdenied', {
                pageaccess: 1,
              });
            } else if (req.url.indexOf('createcm') > -1) {
              res.render('accessdenied', {
                pageaccess: 1,
              });
            } else if (req.url.indexOf('updatecm') > -1) {
              res.render('accessdenied', {
                pageaccess: 1,
              });
            } else if (req.url.indexOf('trackreviews') > -1) {
              res.render('accessdenied', {
                pageaccess: 1,
              });
            } else if (req.url.indexOf('servicereview') > -1) {
              res.render('accessdenied', {
                pageaccess: 1,
              });
            } else if (req.url.indexOf('manageservicereview') > -1) {
              res.render('accessdenied', {
                pageaccess: 1,
              });
            } else {
              setfullName(userId, req, res, next);
            }
            console.log('You are part of DEV/STG READONLY group!!');
          } else {
            req.session.ismasterdatasteward = false;
            req.session.isreadonly = false;
            req.session.isdatasteward = false;
            console.log('You are not a part of any DEV/STG group!!');
            res.render('accessdenied', {
              pageaccess: 0,
            });
          }
        } else if (resp.simpleGroups.indexOf('MYEEM_MASTERDATASTEWARDS') > -1) {
          req.session.ismasterdatasteward = true;
          req.session.isreadonly = false;
          req.session.isdatasteward = false;
          setfullName(userId, req, res, next);
          console.log('You are part of MYEEM MASTER DATASTEWARDS group!!');
        } else if (resp.simpleGroups.indexOf('MYEEM_DATASTEWARDS') > -1) {
          req.session.ismasterdatasteward = false;
          req.session.isreadonly = false;
          req.session.isdatasteward = true;
          if (req.url.indexOf('adminupdatecm') > -1) {
            res.render('accessdenied', {
              pageaccess: 1,
            });
          } else if (req.url.indexOf('adminupdateproducts') > -1) {
            res.render('accessdenied', {
              pageaccess: 1,
            });
          } else if (req.url.indexOf('trackreviews') > -1) {
            res.render('accessdenied', {
              pageaccess: 1,
            });
          } else if (req.url.indexOf('manageservicereview') > -1) {
            res.render('accessdenied', {
              pageaccess: 1,
            });
          } else if (req.url.indexOf('adminupdatefields') > -1) {
            res.render('accessdenied', {
              pageaccess: 1,
            });
          } else if (req.url.indexOf('createcm') > -1) {
            res.render('accessdenied', {
              pageaccess: 1,
            });
          } else if (req.url.indexOf('updatecm') > -1) {
            res.render('accessdenied', {
              pageaccess: 1,
            });
          } else {
            setfullName(userId, req, res, next);
          }
          console.log('You are part of MYEEM DATASTEWARDS group!!');
        } else if (resp.simpleGroups.indexOf('MYEEM_READONLY') > -1) {
          req.session.ismasterdatasteward = false;
          req.session.isreadonly = true;
          req.session.isdatasteward = false;
          if (req.url.indexOf('adminupdatecm') > -1) {
            res.render('accessdenied', {
              pageaccess: 1,
            });
          } else if (req.url.indexOf('adminupdateproducts') > -1) {
            res.render('accessdenied', {
              pageaccess: 1,
            });
          } else if (req.url.indexOf('adminupdatefields') > -1) {
            res.render('accessdenied', {
              pageaccess: 1,
            });
          } else if (req.url.indexOf('createcm') > -1) {
            res.render('accessdenied', {
              pageaccess: 1,
            });
          } else if (req.url.indexOf('updatecm') > -1) {
            res.render('accessdenied', {
              pageaccess: 1,
            });
          } else if (req.url.indexOf('trackreviews') > -1) {
            res.render('accessdenied', {
              pageaccess: 1,
            });
          } else if (req.url.indexOf('servicereview') > -1) {
            res.render('accessdenied', {
              pageaccess: 1,
            });
          }  else if (req.url.indexOf('manageservicereview') > -1) {
            res.render('accessdenied', {
              pageaccess: 1,
            });
          } else {
            setfullName(userId, req, res, next);
          }
          console.log('You are part of MYEEM READONLY group!!');
        } else {
          req.session.ismasterdatasteward = false;
          req.session.isreadonly = false;
          req.session.isdatasteward = false;
          console.log('You are not a part of any group!!');
          res.render('accessdenied', {
            pageaccess: 0,
          });
        }
      }).catch((e) => {
        console.log('Error in Authorization');
        console.log(e);
        console.log('Error in Authorization end');
        res.render('error');
      });
  } catch (e) {
    console.log('FetchUserID Function issue --SSO + AD');
    console.log(e);
    res.render('error');
  }
}

auth.ignore(['/css/janrain.css']);
auth.ignore(['/css/janrain-mobile.css']);
auth.ignore(['/vendor/janrain-init.js']);
auth.ignore(['/vendor/janrain-utils.js']);
auth.ignore(['/css/style.css']);
auth.ignore(['/']);
router.get('/', (req, res) => {
  res.render('login');
});

auth.ignore(['/css/janrain.css']);
auth.ignore(['/css/janrain-mobile.css']);
auth.ignore(['/vendor/janrain-init.js']);
auth.ignore(['/vendor/janrain-utils.js']);
auth.ignore(['/css/style.css']);
auth.ignore(['/forgotpassword']);
router.get('/forgotpassword', (req, res) => {
  res.render('forgotpassword');
});

auth.ignore(['/fonts/Roboto-Bold.ttf']);
auth.ignore(['/fonts/Roboto-Regular.ttf']);
auth.ignore(['/fonts/Roboto-Medium.ttf']);
auth.ignore(['/css/janrain.css']);
auth.ignore(['/css/janrain-style.css']);
auth.ignore(['/css/janrain-mobile.css']);
auth.ignore(['/css/style.css']);
auth.ignore(['/vendor/janrain-init.js']);
auth.ignore(['/vendor/janrain-utils.js']);
auth.ignore(['/img/loading.gif']);
auth.ignore(['/externallogin']);
router.get('/externallogin', (req, res) => {
  const janrainenv = process.env.JANRAINENV;
  res.render('janrainlogin', {
    data: janrainenv,
  });
});

auth.ignore(['/fonts/Roboto-Bold.ttf']);
auth.ignore(['/fonts/Roboto-Regular.ttf']);
auth.ignore(['/fonts/Roboto-Medium.ttf']);
auth.ignore(['/css/janrain.css']);
auth.ignore(['/css/janrain-style.css']);
auth.ignore(['/css/janrain-mobile.css']);
auth.ignore(['/css/style.css']);
auth.ignore(['/vendor/janrain-init.js']);
auth.ignore(['/vendor/janrain-utils.js']);
auth.ignore(['/externalregister']);
router.get('/externalregister', (req, res) => {
  const janrainenv = process.env.JANRAINENV;
  res.render('janrainregister', {
    data: janrainenv,
  });
});

router.get('/csvupload', (req, res) => {
  res.render('csvupload', {layout: 'adminmain'});
});

router.post('/upload', (req, res) => {
  console.log('sample', req.files);
  const { sampleFile } = req.files;
  console.log('file upload', sampleFile);
  sampleFile.mv('./sample.csv', (err) => {
    if (err) { return res.status(500).send(err); }
    console.log('file uploaded');
    csvjson.migrate(req, res);
  });
});

router.get('/csv', (req, res) => {
  res.render('csv',{layout: 'adminmain'});
});

// index route
router.get('/search', fetchUserId, (req, res, next) => {
  user.search(req, res, next);
});
// janrain code

auth.ignore(['/fonts/Roboto-Bold.ttf']);
auth.ignore(['/fonts/Roboto-Regular.ttf']);
auth.ignore(['/fonts/Roboto-Medium.ttf']);
auth.ignore(['/css/style.css']);
auth.ignore(['/img/elanco-login-logo.png']);
auth.ignore(['/img/myEEM-login-logo.png']);
auth.ignore(['/login']);
router.get('/login', (req, res) => {
  elancopartner.elancopartnerlogin(req, res);
});
auth.ignore(['/registration']);
router.get('/registration', (req, res) => {
  elancopartner.elancopartnerregistration(req, res);
});
// router.post('/checklogin', (req, res) => {
//   elancopartner.checklogin(req, res);
// });
// end of janrain code
router.get('/updateactivestatus', (req, res, next) => {
  admin.updateactivestatus(req, res, next);
});

// ADMIN DROPDOWN CODE
router.get('/adminupdatefields', fetchUserId, (req, res, next) => {
  admin.fetchDropdownCategory(req, res, next);
});

// v2:: start
router.get('/manageservicereview', fetchUserId, (req, res, next) => {
  admin.fetchServiceFunction(req, res, next);
});

router.get('/fetchservicereviewfunction', (req, res, next) => {
  admin.FetchServiceReviewFunction(req, res, next);
});

// GET
router.get('/trackreviews', fetchUserId, (req, res, next) => {
  admin.ServiceReviewCmDetails(req, res, next);
});

// POST
router.put('/updateservicereviewcmdetail', (req, res, next) => {
  admin.ChangeServiceReviewStatus(req, res, next);
});
// v2:: end

router.get('/fetchdropdownitem', (req, res, next) => {
  admin.fetchDropdownItem(req, res, next);
});

router.post('/adddropdownitem', (req, res, next) => {
  admin.addDropdownItem(req, res, next);
});
router.post('/fetchreviewwindow/', (req, res, next) => {
  admin.fetchReviewWindow(req, res, next);
});
router.post('/savereviewwindow/', (req, res, next) => {
  admin.saveReviewWindow(req, res, next);
});

// v2:: start
router.post('/addnewserviceitem', (req, res, next) => {
  admin.addNewServiceItem(req, res, next);
});

router.put('/editserviceitem/:manageservicereviewId', (req, res, next) => {
  admin.editServiceItem(req, res, next);
});

// v2:: end

router.put('/editdropdownitem/:dropdownId', (req, res, next) => {
  admin.editDropdownItem(req, res, next);
});

router.put('/deletedropdownitem/:dropdownId', (req, res, next) => {
  admin.deleteDropdownItem(req, res, next);
});

// v2:: start
router.put('/deleteserviceitem/:manageservicereviewId', (req, res, next) => {
  admin.deleteServiceItem(req, res, next);
});
// v2::end

// END OF ADMIN DROPDOWN CODE

// Code for Manage CM
router.get('/updateoverviewstatus', (req, res, next) => {
  admin.updateoverviewstatus(req, res, next);
});

router.post('/updateactivestatus', (req, res, next) => {
  admin.updateactivestatus(req, res, next);
});

router.get('/adminupdatecm', fetchUserId, (req, res, next) => {
  admin.managecm(req, res, next);
});
router.get('/adminupdateproducts', fetchUserId, (req, res, next) => {
  admin.manageProduct(req, res, next);
});
// END OF MANAGE CM CODE

router.get('/searchcm', (req, res, next) => {
  user.getcms(req, res, next);
});

// USER : CREATE,UPDATE NEW CM,CM Metrics
router.get('/createcm', fetchUserId, (req, res, next) => {
  user.createcm(req, res, next);
});

router.get('/updatecm', fetchUserId, (req, res, next) => {
  user.updatecm(req, res, next);
});

router.post('/createnewcm', (req, res, next) => {
  user.createnewcm(req, res, next);
});

router.post('/updatenewcm', (req, res, next) => {
  user.updatenewcm(req, res, next);
});

router.get('/cmmetrics', fetchUserId, (req, res, next) => {
  user.cmmetrics(req, res, next);
});
router.post('/fetchcmdata', (req, res, next) => {
  user.fetchcmdata(req, res, next);
});
router.post('/fetchcmdataforservicereview', (req, res, next) => {
  user.fetchcmdataforservicereview(req, res, next);
});
router.post('/fetchservicereviewdata', (req, res, next) => {
  user.fetchServicereviewData(req, res, next);
});
router.post('/fetchcmmetrics', (req, res, next) => {
  user.fetchcmmetrics(req, res, next);
});

router.post('/savecmmetrics', (req, res, next) => {
  user.savecmmetrics(req, res, next);
});

router.post('/saveservicereview', (req, res, next) => {
  user.saveservicereview(req, res, next);
});

// END OF  USER : CREATE and UPDATE NEW CM

// FETCH PRODUCTS
router.get('/products', fetchUserId, (req, res, next) => {
  user.fetchproducts(req, res, next);
});
router.get('/exporttoexcel', (req, res) => {
  user.exporttoexcel(req, res);
});
// END OF FETCH PRODUCTs

function searchlillyuser(req, res, next) {
  try {
    // const searchuser = req.body.Search;
    let searchuser = [];
    const username = req.body.userdetails;
    searchuser = username.split(' ');
    const stringArray = [];
    async.forEachOf(searchuser, (result, i, callback) => {
      const SearchURL1 = `https://soa.lilly.com:8443/EMDM/v2/GWF_Workers?$filter=contains(tolower(FirstName),'${searchuser[i]}')&$select=SystemLogonId,LastName,FirstName,InternetEmailAddress,StatusCode`;
      const SearchURL2 = `https://soa.lilly.com:8443/EMDM/v2/GWF_Workers?$filter=contains(tolower(LastName),'${searchuser[i]}')&$select=SystemLogonId,LastName,FirstName,InternetEmailAddress,StatusCode`;
      const SearchURL3 = `https://soa.lilly.com:8443/EMDM/v2/GWF_Workers?$filter=contains(tolower(InternetEmailAddress),'${searchuser[i]}')&$select=SystemLogonId,LastName,FirstName,InternetEmailAddress,StatusCode`;
      const lillyuserdetails = {
        key: process.env.API_KEY,
        cert: process.env.API_CERT,
        passphrase: process.env.API_PASSPHRASE,
        url: SearchURL1,
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Accept-Charset': 'utf-8',
          'User-Agent': 'my-reddit-client',
          Authorization: `Basic ${new Buffer.from(ADGROUP).toString('base64')}`,
        },
      };
      const lillyuserdetails2 = {
        key: process.env.API_KEY,
        cert: process.env.API_CERT,
        passphrase: process.env.API_PASSPHRASE,
        url: SearchURL2,
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Accept-Charset': 'utf-8',
          'User-Agent': 'my-reddit-client',
          Authorization: `Basic ${new Buffer.from(ADGROUP).toString('base64')}`,
        },
      };
      const lillyuserdetails3 = {
        key: process.env.API_KEY,
        cert: process.env.API_CERT,
        passphrase: process.env.API_PASSPHRASE,
        url: SearchURL3,
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Accept-Charset': 'utf-8',
          'User-Agent': 'my-reddit-client',
          Authorization: `Basic ${new Buffer.from(ADGROUP).toString('base64')}`,
        },
      };
      rp(lillyuserdetails).then((response, err) => {
        if (response) {
          const data = JSON.parse(response);
          for (let j = 0; j < data.value.length; j++) {
            if (data.value[j].StatusCode === '3' && data.value[j].InternetEmailAddress !== ''
              && data.value[j].InternetEmailAddress !== null
              && data.value[j].InternetEmailAddress !== undefined) {
              const fullname = `${data.value[j].FirstName} ${data.value[j].LastName}`;
              stringArray.push(
                `${fullname}| ${(data.value[j].InternetEmailAddress).toLowerCase()}`,
              );
            }
          }
        } else {
          stringArray.push(err);
        }
        return rp(lillyuserdetails2);
      }).then((response2, err) => {
        if (response2) {
          const data = JSON.parse(response2);
          for (let j = 0; j < data.value.length; j++) {
            if (data.value[j].StatusCode === '3' && data.value[j].InternetEmailAddress !== ''
              && data.value[j].InternetEmailAddress !== null
              && data.value[j].InternetEmailAddress !== undefined) {
              const fullname = `${data.value[j].FirstName} ${data.value[j].LastName}`;
              stringArray.push(
                `${fullname}| ${(data.value[j].InternetEmailAddress).toLowerCase()}`,
              );
            }
          }
        } else {
          stringArray.push(err);
        }
        return rp(lillyuserdetails3);
      }).then((response3, err) => {
        if (response3) {
          const data = JSON.parse(response3);
          for (let j = 0; j < data.value.length; j++) {
            if (data.value[j].StatusCode === '3' && data.value[j].InternetEmailAddress !== ''
              && data.value[j].InternetEmailAddress !== null
              && data.value[j].InternetEmailAddress !== undefined) {
              const fullname = `${data.value[j].FirstName} ${data.value[j].LastName}`;
              stringArray.push(
                `${fullname}| ${(data.value[j].InternetEmailAddress).toLowerCase()}`,
              );
            }
          }
          callback();
        } else {
          stringArray.push(err);
        }
      });
    }, () => {
      res.send(stringArray);
      next();
    });
  } catch (e) {
    console.log(e);
  }
}

function arrayUnique(array) {
  const a = array.concat();
  for (let i = 0; i < a.length; ++i) {
    for (let j = i + 1; j < a.length; ++j) {
      if (a[i] === a[j]) {
        a.splice(j--, 1);
      }
    }
  }

  return a;
}
function requestsoamanagead(rawdata) {
  return new Promise((resolve) => {
    const soaopt = {
      uri: `https://soa.lilly.com:8443/EMDM/v2/GWF_Workers?$filter=(${rawdata})&$select=SystemLogonId,LastName,FirstName,MiddleName,InternetEmailAddress,StatusCode`,
      key: process.env.API_KEY,
      cert: process.env.API_CERT,
      passphrase: process.env.API_PASSPHRASE,
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Accept-Charset': 'utf-8',
        'User-Agent': 'my-reddit-client',
        Authorization: `Basic ${new Buffer.from(ADGROUP).toString('base64')}`,
      },
    };
    rp(soaopt)
      .then((adgrpFullResponse, e) => {
        console.log('************adgrpFullResponse');
        console.log(adgrpFullResponse);
        if (adgrpFullResponse) {
          const data = JSON.parse(adgrpFullResponse);
          for (let j = 0; j < data.value.length; j++) {
            if (data.value[j].StatusCode === '3' && data.value[j].InternetEmailAddress !== ''
              && data.value[j].InternetEmailAddress !== null
              && data.value[j].InternetEmailAddress !== undefined) {
              const fullname = `${data.value[j].FirstName} ${data.value[j].LastName}`;
              
              stringArraysoa.push({
                'SystemLogonId': `${data.value[j].SystemLogonId}`,
                'FirstName' : `${data.value[j].FirstName}`,
                'LastName' : `${data.value[j].LastName}`,
                'InternetEmailAddress' : `${data.value[j].InternetEmailAddress}`,
              });
            }
          }
        } else {
          console.log('************adgrpresponse error');
          console.log(e);
          stringArraysoa.push(e);
        }
        resolve();
        return rp(soaopt);
      });
  });
}
function requestsoa(rawdata, searchuser) {
  return new Promise((resolve) => {
    const soaopt = {
      // uri: `https://soa.lilly.com:8443/EMDM/v2/GWF_Workers?$filter=(${rawdata}) and contains(tolower(FirstName),'${searchuser}')&$select=SystemLogonId,LastName,FirstName,MiddleName,InternetEmailAddress,StatusCode`,
      uri: `https://soa.lilly.com:8443/EMDM/v2/GWF_Workers?$filter=(${rawdata})&$select=SystemLogonId,LastName,FirstName,MiddleName,InternetEmailAddress,StatusCode`,
      key: process.env.API_KEY,
      cert: process.env.API_CERT,
      passphrase: process.env.API_PASSPHRASE,
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Accept-Charset': 'utf-8',
        'User-Agent': 'my-reddit-client',
        Authorization: `Basic ${new Buffer.from(ADGROUP).toString('base64')}`,
      },
    };
    rp(soaopt)
      .then((adgrpFullResponse, e) => {
        console.log('************adgrpFullResponse');
        console.log(adgrpFullResponse);
        if (adgrpFullResponse) {
          const data = JSON.parse(adgrpFullResponse);
          for (let j = 0; j < data.value.length; j++) {
            if (data.value[j].StatusCode === '3' && data.value[j].InternetEmailAddress !== ''
              && data.value[j].InternetEmailAddress !== null
              && data.value[j].InternetEmailAddress !== undefined) {
              const fullname = `${data.value[j].FirstName} ${data.value[j].LastName}`;
              // stringArraysoa.push(
              //   `${fullname}| ${(data.value[j].InternetEmailAddress).toLowerCase()}`,
              // );
              stringArraysoa.push({
                SystemLogonId: `${data.value[j].SystemLogonId}`,
                FirstName : `${data.value[j].FirstName}`,
                LastName : `${data.value[j].LastName}`,
                InternetEmailAddress : `${data.value[j].InternetEmailAddress}`,
              });
            }
          }
        } else {
          console.log('************adgrpresponse error');
          console.log(e);
          stringArraysoa.push(e);
        }
        resolve();
        return rp(soaopt);
      }).catch((e) => {
        console.log('Error in request soa function call');
        console.log(e);
      });
  });
}

function searchlillyuserfromad(req, res, next) {
  try {
    // const searchuser = req.body.Search;
    let searchuser = [];
    const username = req.body.userdetails;
    searchuser = username.split(' ');
    const stringArray = [];
    async.forEachOf(searchuser, (result, ind, callback) => {
      const soaoptions = {
        uri: 'https://soa-d.xh1.lilly.com:8443/ad/groupMemberSystemIDs?groupSearchPattern=MYEEM_MASTERGROUP',
        key: process.env.API_KEY,
        cert: process.env.API_CERT,
        passphrase: process.env.API_PASSPHRASE,
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Accept-Charset': 'utf-8',
          'User-Agent': 'my-reddit-client',
          Authorization: `Basic ${new Buffer.from(ADGROUP).toString('base64')}`,
        },
      };
      rp(soaoptions)
        .then((adgrp) => {
          console.log('Response from AD Group 1 ');
          console.log(adgrp);
          const adgrpkeymg = 'CN=MYEEM_MASTERGROUP,OU=Universal Groups,OU=Groups,DC=AM,DC=LILLY,DC=com';
          const adgrpmem = JSON.parse(adgrp);
          const adgrpuniqe = arrayUnique(adgrpmem[adgrpkeymg]);
          console.log('Array of MASTERGROUP');
          console.log(adgrpuniqe);
          console.log('Length of MASTERGROUP');
          console.log(adgrpuniqe.length);
          const arraylength = adgrpuniqe.length;
          const promiseArray = [];
          const arraysplit = Math.ceil(arraylength / 180);
          const finalarray = (splitUp(adgrpuniqe, arraysplit));
          for (let i = 0; i < finalarray.length; i++) {
            const data = finalarray[i];
            for (let j = 0; j < data.length; j++) {
              if (j === finalarray[i].length - 1) {
                finalarray[i][j] = `SystemLogonId eq '${data[j]}'`;
              } else {
                finalarray[i][j] = `SystemLogonId eq '${data[j]}' or `;
              }
            }
          }
          console.log('loop started');
          stringArraysoa = [];
          for (let i = 0; i < finalarray.length; i++) {
            const data = finalarray[i].join(' ');
            console.log('print inside loop');
            console.log(searchuser[ind]);
            promiseArray.push(requestsoa(data, searchuser[ind]));
          }
          Promise.all(promiseArray)
            .then(() => {
              console.log('loop ended new`');
              console.log(searchuser[ind]);
              console.log(stringArraysoa);
              leaderArraysoa = [];
              let finalArraysoa = [];
              leaderArraysoa = stringArraysoa.filter(function(obj) {
              // if(searchuser[ind].indexOf(obj.FirstName) === -1 ||
              //   searchuser[ind].indexOf(obj.LastName) === -1) {
              //     return false;
              //   }
              //   return true;
              return (obj.FirstName.toLowerCase().indexOf(searchuser[ind]) > -1 || obj.LastName.toLowerCase().indexOf(searchuser[ind]) > -1)
              });
              console.log('our new Array');
              console.log(leaderArraysoa);
              for (let i = 0; i < leaderArraysoa.length; i++) {
                const fullname = `${leaderArraysoa[i].FirstName} ${leaderArraysoa[i].LastName}`;
                const value = fullname + '|' + leaderArraysoa[i].InternetEmailAddress.toLowerCase();
                finalArraysoa.push(value);
              }
              console.log('finalArraysoa value');
              console.log(finalArraysoa)
              res.send(finalArraysoa);
              callback();
              next();
            })
            .catch((e) => {
              console.log(e);
            });
        }).catch((err3) => {
          console.log('************catch err3');
          console.log(err3);
        });
    }, () => {
      res.send(stringArray);
      next();
    });
  } catch (e) {
    console.log('************catch e');
    console.log(e);
  }
}

function adgroupmanage(req, res, next, adgroupname) {
  console.log('start of ad Group manage');
  try {
    let searchuser = ['c233814'];
    const stringArray = [];
    async.forEachOf(searchuser, (result, ind, callback) => {
      const soaoptions = {
        uri: `https://soa-d.xh1.lilly.com:8443/ad/groupMemberSystemIDs?groupSearchPattern=${adgroupname}`,
        //const SearchURL1 = 'https://soa.lilly.com:8443/EMDM/v2/GWF_Workers?$select=SystemLogonId,LastName,FirstName,InternetEmailAddress,StatusCode';
        key: process.env.API_KEY,
        cert: process.env.API_CERT,
        passphrase: process.env.API_PASSPHRASE,
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Accept-Charset': 'utf-8',
          'User-Agent': 'my-reddit-client',
          Authorization: `Basic ${new Buffer.from(ADGROUP).toString('base64')}`,
        },
      };
      rp(soaoptions)
        .then((adgrp) => {
          console.log('Response from AD Group 1 ');
          console.log(adgrp);
          const adgrpkeymg = `CN=${adgroupname},OU=Universal Groups,OU=Groups,DC=AM,DC=LILLY,DC=com`;
          const adgrpmem = JSON.parse(adgrp);
          const adgrpuniqe = arrayUnique(adgrpmem[adgrpkeymg]);
          console.log('Array of MASTERGROUP');
          console.log(adgrpuniqe);
          console.log('Length of MASTERGROUP');
          console.log(adgrpuniqe.length);
          const arraylength = adgrpuniqe.length;
          const promiseArray = [];
          const arraysplit = Math.ceil(arraylength / 180);
          const finalarray = (splitUp(adgrpuniqe, arraysplit));
          for (let i = 0; i < finalarray.length; i++) {
            const data = finalarray[i];
            for (let j = 0; j < data.length; j++) {
              if (j === finalarray[i].length - 1) {
                finalarray[i][j] = `SystemLogonId eq '${data[j]}'`;
              } else {
                finalarray[i][j] = `SystemLogonId eq '${data[j]}' or `;
              }
            }
          }
          console.log('loop started');
          stringArraysoa = [];
          for (let i = 0; i < finalarray.length; i++) {
            const data = finalarray[i].join(' ');
            console.log('print inside loop');
        
            promiseArray.push(requestsoamanagead(data));
          }
          Promise.all(promiseArray)
            .then(() => {
              console.log('loop ended`');
              // res.render('manageadgroups', { layout: false,data: stringArraysoa});
              res.send(stringArraysoa);
             // callback();
             // next();
            })
            .catch((e) => {
              console.log(e);
            });
        }).catch((err3) => {
          console.log('************catch err3');
          console.log(err3);
        });
    }, () => {
      // res.render('manageadgroups', { layout: false });
      // res.send(stringArray);
      next();
    });
  } catch (e) {
    console.log('************catch e');
    console.log(e);
  }
}

function searchalllillyuser(req, res, next) {
  try {
    const stringArray = [];
    const SearchURL1 = 'https://soa.lilly.com:8443/EMDM/v2/GWF_Workers?$select=SystemLogonId,LastName,FirstName,InternetEmailAddress,StatusCode';
    const lillyuserdetails = {
      key: process.env.API_KEY,
      cert: process.env.API_CERT,
      passphrase: process.env.API_PASSPHRASE,
      url: SearchURL1,
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Accept-Charset': 'utf-8',
        'User-Agent': 'my-reddit-client',
        Authorization: `Basic ${new Buffer.from(ADGROUP).toString('base64')}`,
      },
    };
    rp(lillyuserdetails).then((response, err) => {
      if (response) {
        const data = JSON.parse(response);
        for (let j = 0; j < data.value.length; j++) {
          if (data.value[j].StatusCode === '3' && data.value[j].InternetEmailAddress !== ''
            && data.value[j].InternetEmailAddress !== null
            && data.value[j].InternetEmailAddress !== undefined) {
            const fullname = `${data.value[j].FirstName} ${data.value[j].LastName}`;
            stringArray.push(
              `${fullname}|${data.value[j].InternetEmailAddress}`,
            );
          }
        }
      } else {
        stringArray.push(err);
      }
      req.body.lillyuser = stringArray;
      next();
    });
  } catch (e) {
    console.log(e);
  }
}

router.get('/searchalllillyuser', searchalllillyuser, (req, res) => {
  console.log(res);
});

router.post('/searchlillyuser', searchlillyuser, (req, res) => {
  console.log(res);
});

router.post('/searchlillyuserfromad', searchlillyuserfromad, (req, res) => {
  console.log(res);
});

// Compare CM Page
router.get('/comparecm', fetchUserId, (req, res, next) => {
  user.comparecm(req, res, next);
});

// Janrain Registration - Select CM
auth.ignore(['/css/janrain.css']);
auth.ignore(['/css/janrain-mobile.css']);
auth.ignore(['/css/style.css']);
auth.ignore(['/vendor/janrain-init.js']);
auth.ignore(['/vendor/janrain-utils.js']);
auth.ignore(['/externaluserpage']);
auth.ignore(['/css/janrainstyle.css']);
auth.ignore(['/img/elanco-logo-footer.png']);
auth.ignore(['/externaluserpage']);
router.get('/externaluserpage', (req, res) => {
  console.log('Inside FetchactiveCM routes');
  if (req.session.userType !== undefined && req.session.userType === 'Janrain') {
    const options1 = {
      url: `${APIURL}/api/getusermasterbyemailid`,
      method: 'POST',
      headers: {
        Authorization: `Basic ${reqheadercredential}`,
        'Content-Type': 'application/json',
      },
      body: {
        logintype: req.session.userType,
        emailid: req.session.emailAddress,
      },
      json: true,
    };
    try {
      rp(options1, (error, response, body) => {
        if (error) {
          console.log(error);
          res.send({
            issuccess: false,
            data: error,
          });
        } else {
          req.session.userdetail = body.result;
          const { userdetail } = req.session;

          if (userdetail.roleid === 8) {
            // ADmin role
            res.redirect('adminuserdetail');
          } else if (userdetail.roleid === 10) {
            // Advanced Role
            user.externallandingpage(req, res, userdetail);
          } else if (userdetail.roleid === 11) {
            // Inactive Role
            res.render('inactiveuser');
          } else {
            // Basic Role
            user.fetchActiveCM(req, res, userdetail);
          }
        }
      });
    } catch (e) {
      console.log(e);
      res.render('error');
    }
  } else {
    res.redirect('externallogin');
  }
});

// test for pdf
router.post('/fetchqualityrisk', (req, res) => {
  console.log('test', req.body.vendor);
  if (req.body !== undefined && req.body !== null) {
    if (req.body.vendor !== undefined && req.body.vendor !== null) {
      // Check if service Item needed
      if (req.body.vendor.isCheckServiceQuestion === 'false') {
        const filestampname = 'QualityRisk.pdf';
        console.log('filename : ', filestampname, moment(new Date()).format('x'));
        const options1 = {
          filename: `./lib/public/document/${filestampname}`,
          format: 'Letter',
          orientation: 'landscape',
          type: 'pdf',
          timeout: '60000',
          border: {
            top: '1cm',
            bottom: '1cm',
          },
        };
        const qData = riskPDF(req.body.vendor, 'Quality', []);
        console.log('get data', req.body);
        console.log('html file content', qData);
        try {
          pdf
            .create(qData, options1)
            .toFile((err) => {
              if (err) return console.log(err);
              res.send('Success');
              return '';
            });
        } catch (e) {
          console.log('PDF Genreating error : ', e);
        }
      } else {
        request.post({
          url: `${API_URL}/api/fetchServiceQuestion`,
          headers: {
            'content-type': 'application/json',
            Authorization: apiauth,
          },
          json: {
            vendorType: req.body.vendor.vendorType,
            cmSegmentation: req.body.vendor.cmSegmentation,
            serviceFunction: 'Quality',
            currentYear: new Date().getFullYear(),
            vendorid: req.body.vendor.vendorid,
          },
        }, (error, response) => {
          if (!error && response.statusCode === 200) {
            console.log('Response from fetch Question API', response.body);
          } else {
            console.log('err ::', error);
            console.log('req ::', req);
          }
          const filestampname = 'QualityRisk.pdf';
          console.log('filename : ', filestampname, moment(new Date()).format('x'));
          const options1 = {
            filename: `./lib/public/document/${filestampname}`,
            format: 'Letter',
            orientation: 'landscape',
            type: 'pdf',
            timeout: '60000',
            border: {
              top: '1cm',
              bottom: '1cm',
            },
          };
          const qData = riskPDF(req.body.vendor, 'Quality', response.body.data);
          console.log('get data', req.body);
          console.log('html file content', qData);
          try {
            pdf
              .create(qData, options1)
              .toFile((err) => {
                if (err) return console.log(err);
                res.send('Success');
                return '';
              });
          } catch (e) {
            console.log('PDF Genreating error : ', e);
          }
        });
      }
    }
  }
});

// Technical Risk
router.post('/fetchtechrisk', (req, res) => {
  console.log('tech risk', req.body.vendor);
  if (req.body !== undefined && req.body !== null) {
    if (req.body.vendor !== undefined && req.body.vendor !== null) {
      // Check if service item needed
      if (req.body.vendor.isCheckServiceQuestion === false) {
        const filestampname = 'TechnicalRisk.pdf';
        const options1 = {
          filename: `./lib/public/document/${filestampname}`,
          format: 'Letter',
          orientation: 'landscape',
          type: 'pdf',
          timeout: '60000',
          border: {
            top: '1cm',
            bottom: '1cm',
          },
        };
        console.log(req.body.vendorname);
        const qData = riskPDF(req.body.vendor, 'Technical', []);
        console.log('get data', req.body);
        console.log('html file content', qData);
        try {
          pdf
            .create(qData, options1)
            .toFile((err) => {
              if (err) return console.log(err);
              res.send('Success');
              return '';
            });
        } catch (e) {
          console.log('PDF Genreating error : ', e);
        }
      } else {
        request.post({
          url: `${API_URL}/api/fetchServiceQuestion`,
          headers: {
            'content-type': 'application/json',
            Authorization: apiauth,
          },
          json: {
            vendorType: req.body.vendor.vendorType,
            cmSegmentation: req.body.vendor.cmSegmentation,
            serviceFunction: 'TSMS',
            currentYear: new Date().getFullYear(),
            vendorid: req.body.vendor.vendorid,
          },
        }, (error, response) => {
          if (!error && response.statusCode === 200) {
            console.log('Response from fetch Question API', response.body);
          } else {
            console.log('err ::', error);
            console.log('req ::', req);
          }
          const filestampname = 'TechnicalRisk.pdf';
          const options1 = {
            filename: `./lib/public/document/${filestampname}`,
            format: 'Letter',
            orientation: 'landscape',
            type: 'pdf',
            timeout: '60000',
            border: {
              top: '1cm',
              bottom: '1cm',
            },
          };
          console.log(req.body.vendorname);
          const qData = riskPDF(req.body.vendor, 'Technical', response.body.data);
          console.log('get data', req.body);
          console.log('html file content', qData);
          try {
            pdf
              .create(qData, options1)
              .toFile((err) => {
                if (err) return console.log(err);
                res.send('Success');
                return '';
              });
          } catch (e) {
            console.log('PDF Genreating error : ', e);
          }
        });
      }
    }
  }
});

// External Vendor Landing Page

router.get('/updateoverviewstatus', (req, res, next) => {
  user.updateoverviewstatus(req, res, next);
});
router.get('/cmoverview', fetchUserId, (req, res, next) => {
  user.cmoverviewdata(req, res, next);
});
router.post('/savecmoverview', (req, res, next) => {
  user.savecmoverview(req, res, next);
});

router.post('/uploadbrandlogo', (req, res, next) => {
  admin.saveImageInContentful(req, res, next);
});


// router.get('/email', (req, res, next) => {
//   user.email(req, res, next);
// });

// router.get('/emailtest', (req, res, next) => {
//   user.emailtest(req, res, next);
// });

router.get('/wsdlTest2', fetchUserId, (req) => {
  request.post({
    url: `${API_URL}/api/pushproductdetails`,
    headers: {
      'content-type': 'application/json',
      Authorization: apiauth,
    },
  }, (error, response) => {
    if (!error && response.statusCode === 200) {
      console.log('Response from API');
    } else {
      console.log(error);
      console.log(req);
    }
  });
});

router.get('/wsdlTest', fetchUserId, (req) => {
  request.post({
    url: `${API_URL}/api/pushcmdetails`,
    headers: {
      'content-type': 'application/json',
      Authorization: apiauth,
    },
  }, (error, response) => {
    if (!error && response.statusCode === 200) {
      console.log('Response from API');
    } else {
      console.log(error);
      console.log(req);
    }
  });
});
// code for janrain auth module

function getuserbywebsiteid(req, res, next) {
  const options = {
    url: `${APIURL}/api/getusermasterbywebsiteid`,
    method: 'POST',
    headers: {
      Authorization: `Basic ${reqheadercredential}`,
      'Content-Type': 'application/json',
    },
    body: {},
    json: true,
  };

  rp(options, (error, response, body) => {
    if (error) {
      console.log(error);
      res.send({
        issuccess: false,
        data: error,
      });
    } else {
      req.body.userlist = body;
      next();
    }
  });
}

function getrolebywebsiteid(req, res, next) {
  const options = {
    url: `${APIURL}/api/getrole`,
    method: 'POST',
    headers: {
      Authorization: `Basic ${reqheadercredential}`,
      'Content-Type': 'application/json',
    },
    body: {},
    json: true,
  };

  rp(options, (error, response, body) => {
    if (error) {
      console.log(error);
      res.send({
        issuccess: false,
        data: error,
      });
    } else {
      req.params.rolelist = body;
      next();
    }
  });
}

auth.ignore(['/assignrole']);
router.post('/assignrole', (req, res) => {
  const options = {
    url: `${APIURL}/api/modifyUserRole`,
    method: 'POST',
    body: {
      userid: req.body.userid,
      roleid: req.body.roleid,
      changedby: 1,
    },
    headers: {
      Authorization: `Basic ${reqheadercredential}`,
      'Content-Type': 'application/json',
    },
    json: true,
  };
  rp(options, (error, response) => {
    if (error) {
      console.log(error);
      res.send({
        issuccess: false,
        data: error,
      });
    } else {
      res.send({
        issuccess: true,
        data: response,
      });
    }
  });
});

auth.ignore(['/saveregistrationdata']);
router.post('/saveregistrationdata', (req, res) => {
  const options = {
    url: `${APIURL}/api/modifyusermaster`,
    method: 'POST',
    headers: {
      Authorization: `Basic ${reqheadercredential}`,
      'Content-Type': 'application/json',
    },
    body: {
      janrainid: req.body.janrainid,
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      emailid: req.body.emailid,
    },
    json: true,
  };

  rp(options, (error, response) => {
    if (error) {
      console.log(error);
      res.send({
        issuccess: false,
        data: error,
      });
    } else {
      res.send({
        issuccess: true,
        data: response,
      });
    }
  });
});
auth.ignore(['/signout']);
router.post('/signout', (req, res) => {
  req.session.destroy();
  res.send('success');
});

auth.ignore(['/forgotpassword']);
router.get('/forgotpassword', (req, res) => {
  const janrainenv = process.env.JANRAINENV;
  res.render('forgotpassword', {
    data: janrainenv,
  });
});

auth.ignore(['/createrole']);
router.get('/createrole', (req, res) => {
  const options = {
    url: `${APIURL}/api/getrole`,
    method: 'POST',
    headers: {
      Authorization: `Basic ${reqheadercredential}`,
      'Content-Type': 'application/json',
    },
    body: {},
    json: true,
  };

  rp(options, (error, response, body) => {
    if (error) {
      console.log(error);
      res.send({
        issuccess: false,
        data: error,
      });
    } else if (req.session.userdetail !== undefined && req.session.userdetail.roleid === 8) {
      const { userdetail } = req.session;
      res.render('createrole', {
        layout: 'janrainmain',
        userdetail,
        rolelist: body,
        helpers: {
          counter(index) {
            return index + 1;
          },
        },
      });
    } else {
      res.redirect('login');
    }
  });
});
auth.ignore(['/assignrole']);
router.get('/assignrole', getuserbywebsiteid, getrolebywebsiteid, (req, res) => {
  if (req.session.userdetail !== undefined && req.session.userdetail.roleid === 8) {
    const ud = (req.session.userdetail);
    const userlistdetails = req.body.userlist;
    const rolelistdetails = req.params.rolelist;
    console.log('userlistdetails...');
    console.log(userlistdetails);
    console.log(rolelistdetails);
    console.log('rolelistdetails...');
    res.render('assignrole', {
      layout: 'janrainmain',
      userlist: userlistdetails,
      userdetail: ud,
      rolelist: rolelistdetails,
    });
  } else {
    res.redirect('externallogin');
  }
});

auth.ignore(['/getselectedrolebyuserid']);
router.post('/getselectedrolebyuserid', (req, res) => {
  const options = {
    url: `${APIURL}/api/getselectedrolebyuserid`,
    method: 'POST',
    body: {
      userid: req.body.userid,
    },
    headers: {
      Authorization: `Basic ${reqheadercredential}`,
      'Content-Type': 'application/json',
    },
    json: true,
  };
  rp(options, (error, response) => {
    if (error) {
      console.log(error);
      res.send({
        issuccess: false,
        data: error,
      });
    } else {
      res.send({
        issuccess: true,
        data: response,
      });
    }
  });
});

auth.ignore(['/getuser']);
router.post('/getuser', (req, res) => {
  const accessUrl = JANRAINURL + req.body.accesstoken;

  const options = {
    url: accessUrl,
    method: 'GET',
    resolveWithFullResponse: true,
  };

  rp(options, (error, response) => {
    if (error) {
      console.log(error);
      res.send({
        issuccess: false,
        data: error,
      });
    } else {
      const userData = JSON.parse(response.body);

      if (userData.stat === 'ok') {
        req.session.emailAddress = userData.result.professionalContactData.emailAddress;
        req.session.uuid = userData.result.uuid;
        req.session.firstName = userData.result.personalData.firstName;
        req.session.lastName = userData.result.personalData.lastName;

        const options1 = {
          url: `${APIURL}/api/modifyusermaster`,
          method: 'POST',
          headers: {
            Authorization: `Basic ${reqheadercredential}`,
            'Content-Type': 'application/json',
          },
          body: {
            janrainid: userData.result.uuid,
            firstname: userData.result.personalData.firstName,
            lastname: userData.result.personalData.lastName,
            emailid: userData.result.professionalContactData.emailAddress,
          },
          json: true,
        };

        rp(options1, (err, resp, body) => {
          if (err) {
            console.log(err);
            res.send({
              issuccess: false,
              data: err,
            });
          } else if (userData.result.password.value == null) {
            req.session.userType = 'Lilly SSO';
            res.send({
              issuccess: true,
              data: body,
            });
          } else {
            req.session.userType = 'Janrain';
            res.send({
              issuccess: true,
              data: body,
            });
          }
        });
      } else {
        res.send({
          issuccess: false,
          data: userData.stat,
        });
      }
    }
  });
});

auth.ignore(['/saveuserdata']);
router.post('/saveuserdata', (req, res) => {
  const options = {
    url: `${APIURL}/api/modifymetadetailsusermaster`,
    method: 'POST',
    headers: {
      Authorization: `Basic ${reqheadercredential}`,
      'Content-Type': 'application/json',
    },
    body: {
      emailid: req.session.emailAddress,
      metafield1: req.body.metafield1,
      metafield2: req.body.metafield2,
      metafield3: req.body.metafield3,
      metafield4: req.body.metafield4,
      metafield5: req.body.metafield5,
      metafield6: req.body.metafield6,
      metafield7: req.body.metafield7,
      metafield8: req.body.metafield8,
      changedby: null,
    },
    json: true,
  };

  rp(options, (error, response) => {
    if (error) {
      console.log(error);
      res.send({
        issuccess: false,
        data: error,
      });
    } else {
      user.sendexternalemail(req, res);
      res.send({
        issuccess: true,
        data: response,
      });
    }
  });
});
// auth.ignore(['/approveext']);
router.get('/approveext', fetchUserId, (req, res) => {
  const useremaildetails = sanitizer.escape(req.query.useremaildetails);
  const decoded = CryptoJS.enc.Base64.parse(useremaildetails).toString(CryptoJS.enc.Utf8);
  const useremaildetailsarray = decoded.split('&');
  const emailid = useremaildetailsarray[0];
  const roleid = parseInt(useremaildetailsarray[1], 0);
  const fname = useremaildetailsarray[2];
  const lname = useremaildetailsarray[3];
  let approve = false;
  let msg = '';
  if (roleid === 10) {
    msg = 'The request has been approved.';
    approve = true;
  } else {
    msg = 'The request has been rejected.';
    approve = false;
  }

  const options = {
    url: `${APIURL}/api/userrole_update`,
    method: 'POST',
    headers: {
      Authorization: `Basic ${reqheadercredential}`,
      'Content-Type': 'application/json',
    },
    body: {
      emailid,
      roleid,
    },
    json: true,
  };

  rp(options, (error, response) => {
    if (error) {
      console.log(error);
      res.send({
        issuccess: false,
        data: error,
      });
    } else {
      console.log(`Success ${response}`);
      res.render('janrainapprove', {
        data: msg,
        firstname: fname,
        lastname: lname,
        email: emailid,
        approval: approve,
      });
    }
  });
});

auth.ignore(['/createrole']);
router.post('/createrole', (req, res) => {
  const options = {
    url: `${APIURL}/api/modifyrole`,
    method: 'POST',
    headers: {
      Authorization: `Basic ${reqheadercredential}`,
      'Content-Type': 'application/json',
    },
    body: {
      rolename: req.body.rolename,
      isdefault: req.body.isdefault,
      description: req.body.description,
      changedby: 1,
    },
    json: true,
  };

  rp(options, (error, response) => {
    if (error) {
      console.log(error);
      res.send({
        issuccess: false,
        data: error,
      });
    } else {
      res.send({
        issuccess: true,
        data: response,
      });
    }
  });
});

auth.ignore(['/adminuserdetail']);
router.get('/adminuserdetail', (req, res) => {
  const options = {
    url: `${APIURL}/api/getusermasterbywebsiteid`,
    method: 'POST',
    headers: {
      Authorization: `Basic ${reqheadercredential}`,
      'Content-Type': 'application/json',
    },
    body: {},
    json: true,
  };

  rp(options, (error, response, body) => {
    if (error) {
      console.log(error);
      res.send({
        issuccess: false,
        data: error,
      });
    } else if (req.session.userdetail !== undefined && req.session.userdetail.roleid === 8) {
      const { userdetail } = req.session;
      res.render('adminuserdetail', {
        layout: 'janrainmain',
        userlist: body,
        userdetail,
      });
    } else {
      res.redirect('login');
    }
  });
});


// end of code for janrain auth module

router.get('/pullcmdetails/:partnercode', (req, res, next) => {
  SAPBO.pullCMDetails(req, res, next);
});

router.get('/notfound', (req, res) => {
  res.render('notfound');
});

router.get('/servicereview', fetchUserId, (req, res) => {
  user.servicereview(req, res);
});
router.get('/checkuser', (req, res) => {
  if (req.session !== undefined) {
    if (req.session.passport !== undefined) {
      if (req.session.passport.user !== undefined) {
        res.status(200).send({
          message: 'auth success',
        });
      } else {
        res.status(401).send({
          message: 'auth error',
        });
      }
    } else {
      res.status(401).send({
        message: 'auth error',
      });
    }
  } else {
    res.status(401).send({
      message: 'auth error',
    });
  }
});

const todaydate = moment().subtract(12, 'M').format('YYYY-MM-DD').toString();

const dateparams = `javascript:gs.dateGenerate('${todaydate}','23:59:59')`;

console.log('date params print here');

console.log(dateparams);
const optionsAuth = { user: `${process.env.SNOW_USERNAME}`, password: `${process.env.SNOW_PASSWORD}` };

const Client = require('node-rest-client').Client;

const client = new Client(optionsAuth);

function dataList(res, management, title) {
  const group = 'ELANCOMQ-TIER2-TCS';
  const url = `https://lilly.service-now.com/api/now/table/${management}?sysparm_display_value=true&sysparm_query=sys_created_on>${dateparams}^assignment_group.name=${group}&sysparm_fields=number,state,assigned_to,impact,priority,severity,short_description,opened_at,closed_at,calendar_duration,time_worked,assignment_group,u_ci_class_filter,cmdb_ci`;
  console.log(client)
  try{

    client.get(url, (data1) => {
      const items = data1.result;
      console.log(url);
      console.log("data "+items);
      console.log("item: "+JSON.parse(JSON.stringify(data1)));
      console.log("json"+JSON.stringify(data1));
      const reqItems = [];
      if(items !==undefined){
      for (let i = 0; i < items.length; i++) {
        const row = {};

        row.ticket_number = items[i].number.toString();

        if (items[i].short_description) {
          row.short_description = items[i].short_description;
        } else {
          row.short_description = null;
        }

        if (items[i].opened_at) {
          row.opend_at = moment(items[i].opened_at).format('DD/MM/YYYY');
        } else {
          row.opend_at = null;
        }
        if (items[i].opened_at === items[i].closed_at) {
          row.isOpenCloseSame = true;
        }
        if (items[i].state) {
          row.state = items[i].state;
        } else {
          row.state = null;
        }

        if (items[i].time_worked) {
          row.time_worked = items[i].time_worked;
        } else {
          row.time_worked = '-';
        }
        if (items[i].u_ci_class_filter  && items[i].u_ci_class_filter !== 'null') {
          row.classfilter = items[i].u_ci_class_filter;
        } else {
          row.classfilter = '';
        }
        if (items[i].cmdb_ci && items[i].cmdb_ci.display_value !== null) {
          row.cmdbci  = items[i].cmdb_ci.display_value;
        } else {
          row.cmdbci  = '';
        }

        reqItems.push(row);
      }

      res.render('adminoperations', { layout: false, data: reqItems, title });
    }
    else{
      res.render("error")
    }
    });
  }catch(err){
    console.log("err")
    res.render("error")
  }
}


router.get('/admin/manageritm', (req, res) => {
  console.log('manage ritm called');
  try {
    dataList(res, 'sc_req_item', 'RITM Management');
  } catch (err) {
    console.log(err);
    res.render('error')
  }
});

router.get('/admin/managecr', (req, res) => {
  try {
    dataList(res, 'change_request', 'CR Management');
  } catch (err) {
    console.log("error display")
    console.log("error"+err);
    res.render('error')
  }
});

router.get('/admin/manageadgroups', (req, res, next) => {
  try {
    const myEem = process.env.myEem.split(",")
    const changeDev = process.env.changeDev.split(",")
    console.log(changeDev)
    res.render('manageadgroups', { layout: false,changeDev:changeDev,myEem:myEem});
    // adgroupmanage(req, res, next, 'MYEEM_MASTERDATASTEWARDS');
  } catch (err) {
    console.log(err);
    res.render('error')
  }
});

router.post('/admin/manageadgroups', (req, res, next) => {
  try {
    console.log(req.body.group)
    adgroupmanage(req, res, next, req.body.group);
  } catch (err) {
    console.log(err);
    res.render('error')
  }
});

router.get('/admin/manageincident', (req, res) => {
  try {
    dataList(res, 'incident', 'Incident  Management');
  } catch (err) {
    console.log(err);
    res.render('error')
  }
});

module.exports = router;
