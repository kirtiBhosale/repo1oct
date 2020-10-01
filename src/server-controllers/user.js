/* eslint-disable */
const moment =require('moment');

const request = require('request');
const contentful = require('contentful');
const xl = require('excel4node');
const nodemailer = require('nodemailer');
const Promise = require('bluebird');
const sanitizer = require('sanitizer');
const rp = require('request-promise');
const utilities = require('./Utilities');

const reqheadercredential = (new Buffer.from(`${process.env.AUTHAPIUSERNAME}:${process.env.AUTHAPIPASSWORD}`).toString('base64'));
const { APIURL } = process.env;

const cfClient = contentful.createClient({
  // This is the space ID. A space is like a project folder in Contentful terms
  space: process.env.CONTENTFUL_SPACEID,
  // This is the access token for this space.
  // Normally you get both ID and the token in the Contentful web app
  accessToken: process.env.CONTENTFUL_ACCESSTOKEN,
  httpAgent: utilities.createProxyAgent(),
  httpsAgent: utilities.createProxyAgent(),
});

const API_URL = process.env.MYEEM_API_URL;
const username = process.env.MYEEM_API_USERNAME;
const password = process.env.MYEEM_API_PASSWORD;
const auth = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;

console.log("auth"+ auth);
const options = {
  headers: {
    Authorization: auth,
  },
};

function getcms(req, res) {
  try {
    request.get(`${API_URL}/api/cm`, options, (error, response, body) => {
      if (!error && response.statusCode === 200) {
        const result = JSON.parse(body);
        res.render('search', {
          data: result,
          layout: 'main',
        });
      } else {
        console.log(error);
        res.send(error);
      }
    });
  } catch (e) {
    console.log(e);
  }
}

function fetchActiveCM(req, res, userdetail) {
  request.get(`${API_URL}/api/fetchactivecm`, options, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      const result = JSON.parse(body);
      res.render('selectcm', {
        data: result,
        layout: false,
        userdetail,
      });
    } else {
      console.log(error);
      res.send(error);
    }
  });
}

function onlyUnique(value, index, self) {
  return self.indexOf(value) === index;
}

function login(req, res) {
  res.render('login', {
    layout: false,
  });
}
// Create New CM - GET REQUEST
function createcm(req, res) {
  global.appServer.locals.title = 'myEEM Create CM';
  const stringArray = [];
  request.get(`${API_URL}/api/dropdownvalues`, options, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      const result = JSON.parse(body);
      console.log("result"+result);
      const { data } = result;
      for (let i = 0; i < data.length; i++) {
        if (data[i].dropdowncategory === 'Hub Oversight') {
          stringArray.push({
            Id: data[i].dropdownid,
            Value: data[i].dropdownvalue,
          });
        }
      }
      res.render('createcm', {
        layout: 'main',
        data: stringArray,
        fullname: sanitizer.escape(req.session.fullname),
        ismasterdatasteward: sanitizer.escape(req.session.ismasterdatasteward),
        isdatasteward: sanitizer.escape(req.session.isdatasteward),
        isreadonly: sanitizer.escape(req.session.isreadonly),
      });
    } else {
      console.log(error);
      res.send(error);
    }
  });
}
// Update New CM - GET REQUEST
function updatecm(req, res) {
  global.appServer.locals.title = 'myEEM Update CM';
  const stringArray = [];
  const vendorId = sanitizer.escape(req.query.vendorid);
  let VendorName = '';
  let VendorAddress = '';
  let GeneralHubOversight = '';
  let PartnerCode = '';
  request.get(`${API_URL}/api/fetchsinglecmdetails?vendorid=${vendorId}`, options, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      const result = JSON.parse(body);
      const { data } = result;
      if (data.length > 0) {
        VendorName = data[0].vendorname;
        VendorAddress = data[0].vendoraddress;
        GeneralHubOversight = data[0].general_huboversight;
        PartnerCode = data[0].partnercode;
      }
      request.get(`${API_URL}/api/dropdownvalues`, options, (err, resp, content) => {
        if (!err && resp.statusCode === 200) {
          const resultinfo = JSON.parse(content);
          const datainfo = resultinfo.data;
          for (let i = 0; i < datainfo.length; i++) {
            if (datainfo[i].dropdowncategory === 'Hub Oversight') {
              if (datainfo[i].dropdownid === GeneralHubOversight) {
                stringArray.push({
                  Id: datainfo[i].dropdownid,
                  Value: datainfo[i].dropdownvalue,
                  selected: true,
                });
              } else {
                stringArray.push({
                  Id: datainfo[i].dropdownid,
                  Value: datainfo[i].dropdownvalue,
                  selected: false,
                });
              }
            }
          }
          res.render('updatecm', {
            layout: 'main',
            data: stringArray,
            vendorname: VendorName,
            vendoraddress: VendorAddress,
            partnercode: PartnerCode,
            fullname: sanitizer.escape(req.session.fullname),
            ismasterdatasteward: sanitizer.escape(req.session.ismasterdatasteward),
            isdatasteward: sanitizer.escape(req.session.isdatasteward),
            isreadonly: sanitizer.escape(req.session.isreadonly),
          });
        } else {
          console.log(err);
          res.send(err);
        }
      });
    } else {
      console.log(error);
      res.send(error);
    }
  });
}
// Create NEW CM - Post Request
function createnewcm(req, res, next) {
  try {
    //console.log(req.body.vendorcode);
    console.log(req.body.productData);
    
    console.log(req.body.vendorname);
    console.log(req.body.vendoraddress);
    console.log(req.body.vendorhub);
    console.log(sanitizer.escape(req.session.fullname));
    console.log(req.body.issystemgen);
    console.log(req.body.cityname);
    console.log(req.body.vendorpostalcode);
    console.log(req.body.vendorregion);
    console.log(req.body.vendorsearchterm);
    request({
      url: `${API_URL}/api/createnewcm`,
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        Authorization: auth,
      },
      json: {
        vendorcode: req.body.vendorcode,
        vendorname: req.body.vendorname,
        vendoraddress: req.body.vendoraddress,
        vendorhub: req.body.vendorhub,
        createdby: sanitizer.escape(req.session.fullname),
        issystemgen: req.body.issystemgen,
        cityname: req.body.cityname,
        countryname: req.body.countryname,
        vendorpostalcode: req.body.vendorpostalcode,
        vendorregion: req.body.vendorregion,
        vendorsearchterm: req.body.vendorsearchterm,
        productData: req.body.productData,
      },
    }, (error, response) => {
      if (!error && response.statusCode === 200) {
        // res.send(response.body.status);
        res.send(response.body);
      } else {
        next(error);
      }
    });
  } catch (e) {
    next(e);
  }
}
// Update CM - Post Request
function updatenewcm(req, res, next) {
  console.log("fullname in updatenewcm***************",req.session.fullname);
  try {
    request({
      url: `${API_URL}/api/updatenewcm`,
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        Authorization: auth,
      },
      json: {
        sapvendorcode: req.body.sapvendorcode,
        sysvendorcode: req.body.sysvendorcode,
        sapvendorname: req.body.sapvendorname,
        sapvendoraddress: req.body.sapvendoraddress,
        vendorhub: req.body.vendorhub,
        cityname: req.body.cityname,
        countryname: req.body.countryname,
        vendorpostalcode: req.body.vendorpostalcode,
        vendorregion: req.body.vendorregion,
        vendorsearchterm: req.body.vendorsearchterm,
        modifiedby: sanitizer.escape(req.session.fullname),
        productData: req.body.productData,
      },
    }, (error, response) => {
      if (!error && response.statusCode === 200) {
        // res.send(response.body.status);
        res.send(response.body);
      } else {
        next(error);
      }
    });
  } catch (e) {
    next(e);
  }
}
// CM METRICS - GET REQUEST
function cmmetrics(req, res) {
  global.appServer.locals.title = 'myEEM CM Metrics';
  const stringArray = [];
  stringArray.push({
    Id: 0,
    Value: '--Select--',
  });
  request.get(`${API_URL}/api/dropdownvalues`, options, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      const result = JSON.parse(body);
      const { data } = result;
      for (let i = 0; i < data.length; i++) {
        if (data[i].dropdowncategory === 'Hub Oversight') {
          stringArray.push({
            Id: data[i].dropdownid,
            Value: data[i].dropdownvalue,
          });
        }
      }
      res.render('cmmetrics', {
        layout: 'main',
        data: stringArray,
        fullname: sanitizer.escape(req.session.fullname),
        ismasterdatasteward: sanitizer.escape(req.session.ismasterdatasteward),
        isdatasteward: sanitizer.escape(req.session.isdatasteward),
        isreadonly: sanitizer.escape(req.session.isreadonly),
      });
    } else {
      res.send(error);
    }
  });
}
// Service Request - GET REQUEST
function servicereview(req, res) {
  global.appServer.locals.title = 'myEEM Service Review';
  const stringArray = [];
  const stringArrayhsecat = [];
  stringArray.push({
    Id: 0,
    Value: '--Select--',
  });
  request.get(`${API_URL}/api/dropdownvalues`, options, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      const result = JSON.parse(body);
      const { data } = result;
      // v2:: start
      console.log('vendorid', req.query.vendorid);
      console.log('reviewdate', req.query.reviewdate);
      // v2:: end
      for (let i = 0; i < data.length; i++) {
        if (data[i].dropdowncategory === 'Hub Oversight') {
          stringArray.push({
            Id: data[i].dropdownid,
            Value: data[i].dropdownvalue,
          });
        }
        if (data[i].dropdowncategory === 'HSE Category') {
          stringArrayhsecat.push({
            Id: data[i].dropdownid,
            Value: data[i].dropdownvalue,
          });
        }
      }
      res.render('servicereview', {
        layout: 'main',
        data: stringArray,
        serviceValue: process.env.serviceValue,
        datahsecategory: stringArrayhsecat,
        vendorid: req.query.vendorid,
        reviewdate: req.query.reviewdate,
        hubid: req.query.hubid,
        fullname: sanitizer.escape(req.session.fullname),
        ismasterdatasteward: sanitizer.escape(req.session.ismasterdatasteward),
        isdatasteward: sanitizer.escape(req.session.isdatasteward),
        isreadonly: sanitizer.escape(req.session.isreadonly),

      });
    } else {
      res.send(error);
    }
  });
}

function fetchcmdataforservicereview(req, res) {
  const { hubid } = req.body;
  request.get(`${API_URL}/api/fetchcmdetailsforservicereview?hubid=${hubid}`, options, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      const result = JSON.parse(body);
      res.send(result);
    } else {
      res.send(error);
    }
  });
}

function fetchServicereviewData(req, res) {
  const { cmdata } = req.body;
  const reviewdate = moment(req.body.reviewdate).format('DD-MMM-YYYY');
  request.get(`${API_URL}/api/fetchallservicereview?vendorid=${cmdata}&reviewyear=${reviewdate}`, options, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      const result = JSON.parse(body);
      console.log('fetch service api ::', result.data, result.data.length);
      if (result.data !== undefined && result.data !== null && result.data.length > 0) {
        result.data[0].starratingscore = (parseFloat(result.data[0].reviewscore) / 20).toFixed(2);
      }
      res.send(result);
    } else {
      res.send(error);
    }
  });
}

// v2:: start
// function fetchVendorType(req, res, next) {
//   const { hubid } = req.body;
//   request.get(`${API_URL}/api/fetchservicereviewvendortype
//   ?selectfunctionId=${selectfunctionId}`, options, (error, response, body) => {
//     if (!error && response.statusCode === 200) {
//       const result = JSON.parse(body);
//       res.send(result);
//     } else {
//       res.send(error);
//     }
//   });
// }
// v2::end

// CM METRICS - GET CM DETAILS BASED ON HUB SELECTED
function fetchcmdata(req, res) {
  const { hubid } = req.body;
  request.get(`${API_URL}/api/fetchcmdetails?hubid=${hubid}`, options, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      const result = JSON.parse(body);
      res.send(result);
    } else {
      res.send(error);
    }
  });
}
// CM METRICS - FETCH METRICS Data
function fetchcmmetrics(req, res) {
  const { cmdata } = req.body;
  const { hubdata } = req.body;
  const metricdate = moment(req.body.metricdate).format('DD-MMM-YYYY');
  request.get(`${API_URL}/api/fetchmetricsdetails?MetricMonth=${metricdate}&VendorId=${cmdata}&General_HubOversight=${hubdata}`, options, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      const result = JSON.parse(body);
      res.send(result);
    } else {
      res.send(error);
    }
  });
}

function savecmmetrics(req, res, next) {
  console.log("inside savecmmetrics*************",req.session.fullname);
  let isupdatedata;
  if (req.body.cmmetricsflow === '1') {
    // Insert flow
    isupdatedata = false;
  } else {
    // Update flow
    isupdatedata = true;
  }
  try {
    request({
      url: `${API_URL}/api/updatemetricsdetails`,
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        Authorization: auth,
      },
      json: {
        Quality_CriticalDeviation: req.body.criticaldeviations,
        Quality_NonCriticalDeviation: req.body.noncriticaldeviations,
        Quality_OverDueDeviation: req.body.overduedeviation,
        Quality_AuditOpenItems: req.body.auditopenitems,
        Quality_AuditOpenItemsOverdue: req.body.auditopenitemsoverdue,
        Quality_BatchRejected_Num: req.body.batchrejectednum,
        Quality_BatchRejected_Den: req.body.batchrejectedden,
        Quality_BatchApproved_Num: req.body.batchapprovednum,
        Quality_BatchApproved_Den: req.body.batchapprovedden,
        Quality_RecurringDeviation: req.body.recdeviations,
        HSE_MajorOpenItems: req.body.hseopenitems,
        HSE_HSEOpenItems: req.body.hseotheropenitems,
        VendorId: req.body.cmid,
        MetricsId: req.body.metricsid,
        MetricMonth: req.body.cmdate,
        General_HubOversight: req.body.hubid,
        isupdate: isupdatedata,
        CreatedBy: sanitizer.escape(req.session.fullname),
        ModifiedBy: sanitizer.escape(req.session.fullname),
      },
    }, (error, response) => {
      if (!error && response.statusCode === 200) {
        res.send('added');
      } else {
        next(error);
      }
    });
  } catch (e) {
    next(e);
  }
}

function saveriskdetail(qualityRisk, techRisk, vendorid, userid) {
  request({
    url: `${API_URL}/api/updateriskdetail`,
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      Authorization: auth,
    },
    json: {
      qualityRisk,
      techRisk,
      vendorid,
      modifiedby: userid,
    },
  }, (error, response) => {
    if (!error && response.statusCode === 200) {
      console.log('risk detail updated successfully');
    } else {
      console.log('Error occured while updating risk value');
    }
  });
}

function savevendorrisk(vendorDetail, vendorID, QualityRating, TSRating, userid) {
  const selectedVendor = [];
  console.log('vendor data', vendorDetail);
  console.log('All Vendor', vendorID, QualityRating, TSRating);
  const vendorData = (vendorDetail);
  const vendorid = parseInt(vendorID, 0);
  let QualityRiskValue = 0;
  let TechnicalRiskValue = 0;
  // check for selected vendor
  for (let i = 0; i < vendorData.length; i++) {
    if (vendorid === parseInt(vendorData[i].vendorid, 0)) {
      console.log('vendor checked out');
      selectedVendor.push(vendorData[i]);
      break;
    }
  }
  console.log('selected vendor', selectedVendor);
  // env variable with all the values for country, length of relation ship and other
  const servicevalue = JSON.parse(process.env.serviceValue);
  console.log('service value ::', servicevalue);
  let mfg = [];
  if (selectedVendor[0] !== null && selectedVendor[0] !== undefined && selectedVendor.length > 0) {
    if (selectedVendor[0].ts_mfgtech !== null && selectedVendor[0].ts_mfgtech !== undefined && selectedVendor[0].ts_mfgtech !== '') {
      // seprate mfg value into array from csv
      mfg = selectedVendor[0].ts_mfgtech.split(',');
    }
    console.log('mfg value', mfg, servicevalue.Manufacture);
    for (let i = 0; i < mfg.length; i++) {
      console.log('mfg..', servicevalue.Manufacture[mfg[i]]);
      // get value associated with mfg and add it into quality risk or technical risk fields
      QualityRiskValue += servicevalue.Manufacture[mfg[i]];
      TechnicalRiskValue += servicevalue.Manufacture[mfg[i]];
    }
    let LengthRelationInYear;
    if (selectedVendor[0].quality_qtanotinplace === 'true' ||
       (selectedVendor[0].quality_qtasigneddate === '' ||
       selectedVendor[0].quality_qtasigneddate === null ||
       selectedVendor[0].quality_qtasigneddate === undefined)) {
      console.log('len relation empty');
    } else {
      const lenRelationship = Math.abs(new Date(selectedVendor[0].quality_qtasigneddate)
        .getTime() - new Date().getTime());
      const diffDay = Math.ceil(lenRelationship / (1000 * 60 * 60 * 24));
      LengthRelationInYear = diffDay / 365;
      console.log('len relation', LengthRelationInYear.toFixed(2));
    }
    // check for length of relationship value
    if (LengthRelationInYear < 1) {
      QualityRiskValue += servicevalue.Length_of_Relationship['0_1'];
      console.log('inyear < 1..', servicevalue.Length_of_Relationship['0_1']);
    } else if (LengthRelationInYear >= 1 && LengthRelationInYear <= 5) {
      QualityRiskValue += servicevalue.Length_of_Relationship['1_5'];
      console.log('inyear > 1..', servicevalue.Length_of_Relationship['1_5']);
    } else if (LengthRelationInYear > 5) {
      QualityRiskValue += servicevalue.Length_of_Relationship['5+'];
      console.log('inyear > 5..', servicevalue.Length_of_Relationship['5+']);
    }
    // country  value
    if (selectedVendor[0].countryname !== undefined &&
      selectedVendor[0].countryname !== null) {
      console.log('country..', servicevalue.country[selectedVendor[0].countryname]);
      QualityRiskValue += servicevalue.country[selectedVendor[0].countryname];
    }
    // brand value
    if (selectedVendor[0].brands !== undefined && selectedVendor[0].brands !== null) {
      let brandNum = 0;
      brandNum = parseInt(selectedVendor[0].brands, 0);
      console.log('brand num :', brandNum);
      if (brandNum >= 5) {
        TechnicalRiskValue += servicevalue.Brands['5+'];
        console.log('brand > 5..', servicevalue.Brands['5+']);
      } else if (brandNum >= 3 && brandNum <= 4) {
        TechnicalRiskValue += servicevalue.Brands['3_4'];
        console.log('brand < 5..', servicevalue.Brands['3_4']);
      } else if (brandNum >= 1 && brandNum <= 2) {
        TechnicalRiskValue += servicevalue.Brands['1_2'];
        console.log('brand < 2..', servicevalue.Brands['1_2']);
      }
    }
    // service item value for quality and TS/MS
    if(QualityRating !== null && QualityRating !== undefined){
      for (let i = 0; i < QualityRating.length; i++) {
        let reviewvalue = parseInt(QualityRating[i], 0);
        if (reviewvalue === 0) {
          reviewvalue = 5;
        } else if (reviewvalue === 1) {
          reviewvalue = 3;
        } else if (reviewvalue === 2) {
          reviewvalue = 1;
        }
        QualityRiskValue += reviewvalue;
      }
    }
    if(TSRating !== null && TSRating !== undefined){
      for (let i = 0; i < TSRating.length; i++) {
        let reviewvalue = parseInt(TSRating[i], 0);
        if (reviewvalue === 0) {
          reviewvalue = 5;
        } else if (reviewvalue === 1) {
          reviewvalue = 3;
        } else if (reviewvalue === 2) {
          reviewvalue = 1;
        }
        TechnicalRiskValue += reviewvalue;
      }
    }
    // find the risk level
    console.log('total value', TechnicalRiskValue, QualityRiskValue);
    let qualityriskselect = '';
    if (QualityRiskValue <= servicevalue.QualityRisk.Low) {
      console.log('Low Performace Risk');
      qualityriskselect = 'Low';
    } else if (QualityRiskValue > servicevalue.QualityRisk.Low && QualityRiskValue
      <= servicevalue.QualityRisk.Medium) {
      console.log('Medium Performace Risk');
      qualityriskselect = 'Medium';
    } else if (QualityRiskValue > servicevalue.QualityRisk.Medium &&
      QualityRiskValue < servicevalue.QualityRisk.High) {
      console.log('High Performace Risk');
      qualityriskselect = 'High';
    }
    let techriskselect = '';
    if (TechnicalRiskValue <= servicevalue.TechnicalRisk.Low) {
      console.log('Low Performace Risk');
      techriskselect = 'Low';
    } else if (TechnicalRiskValue > servicevalue.TechnicalRisk.Low &&
      TechnicalRiskValue <= servicevalue.TechnicalRisk.Medium) {
      console.log('Medium Performace Risk');
      techriskselect = 'Medium';
    } else if (TechnicalRiskValue > servicevalue.TechnicalRisk.Medium &&
      TechnicalRiskValue < servicevalue.TechnicalRisk.High) {
      console.log('High Performace Risk');
      techriskselect = 'High';
    }
    // update risk detail in cmoverview
    saveriskdetail(qualityriskselect, techriskselect, vendorid, userid);
  } else {
    console.log('Error while selecting vendor');
  }
}

function saveservicereview(req, res, next) {
  const serviceReviewMstJSON = JSON.parse(req.body.serviceReviewMstJSON);
  const serviceReviewDtlInsertArr = JSON.parse(req.body.serviceReviewDtlInsertArr);
  const serviceReviewDtlUpdateArr = JSON.parse(req.body.serviceReviewDtlUpdateArr);
  const vendorData = JSON.parse(req.body.vendorInfo);
  const vendorid = req.body.vendorid;
  const userid = sanitizer.escape(req.session.userid);
  console.log('quality array', vendorData);
  const QualityRating = (req.body.qualityRating);
  const TSRating = req.body.TSRating;
  console.log('serviceReviewMstJSON', serviceReviewMstJSON);
  console.log('serviceReviewDtlInsertArr', serviceReviewDtlInsertArr);
  console.log('serviceReviewDtlUpdateArr', serviceReviewDtlUpdateArr);
  try {
    request({
      url: `${API_URL}/api/saveservicereview`,
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        Authorization: auth,
      },
      json: {
        serviceReviewMstJSON,
        serviceReviewDtlInsertArr,
        serviceReviewDtlUpdateArr,
        modifiedBy: sanitizer.escape(req.session.fullname),
      },
    }, (error, response) => {
      if (!error && response.statusCode === 200) {
        console.log('review status on submit', serviceReviewMstJSON.reviewstatus);
         if (serviceReviewMstJSON.reviewstatus.toLowerCase() === 'closed') {
          savevendorrisk(vendorData, vendorid, QualityRating, TSRating, userid);
         }
        res.send('saved');
      } else {
        next(error);
      }
    });
  } catch (e) {
    next(e);
  }
}

// Compare CM screen - Compares the selected CM
function comparecm(req, res, next) {
  console.log('coming in compare cm block;');
  global.appServer.locals.title = 'myEEM Comparison';
  try {
    const vendorId = sanitizer.escape(req.query.vendorid);
    request.post({
      url: `${API_URL}/api/comparecm`,
      headers: {
        'content-type': 'application/json',
        Authorization: auth,
      },
      json: {
        jsonData: vendorId,
      },
    }, (error, response, body) => {
      console.log('coming in response compare cm block');
      console.log(response.statusCode);
      if (!error && response.statusCode === 200) {
        const comparecmdata = [];
        for (let i = 0; i < body.data.length; i++) {
          console.log('compare cm start......');
          body.data[i].reviewyear = moment(body.data[i].reviewyear).format('YYYY');
          body.data[i].reviewscore = (parseFloat(body.data[i].reviewscore) / 20).toFixed(2);
          if (body.data[i].issysgeneratedvendorcode) {
            console.log('vendor is sys generated');
            body.data[i].reviewstatus = false;
          } else {
            console.log('vendor is NOT sys generated');
            if (body.data[i].general_vendortype !== null
              && (body.data[i].general_vendortype.toLowerCase() === 'cm'
                || body.data[i].general_vendortype.toLowerCase() === 'cm and supplier'
                || body.data[i].general_vendortype.toLowerCase() === 'api cm'
                || body.data[i].general_vendortype.toLowerCase() === 'api supplier'
                || body.data[i].general_vendortype.toLowerCase() === 'api cm and supplier')) {
              console.log('vendor is of desired vendor type');
              if (body.data[i].supply_vendorstatus !== null
                && (body.data[i].supply_vendorstatus.toLowerCase() === 'ongoing operations'
                  || body.data[i].supply_vendorstatus.toLowerCase() === 'in termination')) {
                console.log('vendor is of desired vendor status');
                if (body.data[i].reviewstatus !== null && body.data[i].reviewstatus.toLowerCase() === 'closed') {
                  console.log('vendor review closed');
                  body.data[i].reviewstatus = true;
                } else {
                  console.log('vendor review NOT closed');
                  body.data[i].reviewstatus = false;
                }
              } else {
                console.log('vendor is NOT of desired vendor status');
                body.data[i].reviewstatus = false;
              }
            } else {
              console.log('vendor is NOT of desired vendor type');
              body.data[i].reviewstatus = false;
            }
          }
          if (body.data[i].vendorsearchterm !== undefined
            && body.data[i].vendorsearchterm !== null) {
            const vendorsearchterm = body.data[i].vendorsearchterm.split('/');
            if (vendorsearchterm[1] === 'MP') {
              body.data[i].vendorsearchterm = true;
            } else {
              body.data[i].vendorsearchterm = false;
            }
          } else {
            body.data[i].vendorsearchterm = '';
          }
          console.log(body.data[i]);
          console.log('compare cm end......');
          comparecmdata.push({
            vendorid: body.data[i].vendorid,
            partnercode: body.data[i].partnercode,
            reviewyear: (body.data[i].reviewyear === 'Invalid date') ? null : body.data[i].reviewyear,
            reviewscore: body.data[i].reviewscore,
            qualityreviewscore: (parseFloat(body.data[i].qualityreviewscore) / 4).toFixed(2),
            procurementreviewscore:
              (parseFloat(body.data[i].procurementreviewscore) / 4).toFixed(2),
            supplychainreviewscore:
              (parseFloat(body.data[i].supplychainreviewscore) / 4).toFixed(2),
            tsmsreviewscore: (parseFloat(body.data[i].tsmsreviewscore) / 4).toFixed(2),
            hsereviewscore: (parseFloat(body.data[i].hsereviewscore) / 4).toFixed(2),
            vendorsearchterm: body.data[i].vendorsearchterm,
            hubid: body.data[i].general_huboversight,
          });
        }
        console.log('compare data print....');
        console.log(comparecmdata);
        console.log('compare data print end....');
        res.render('comparecm', {
          data: body.data,
          comparecmdata: JSON.stringify(comparecmdata),
          layout: 'main',
          fullname: sanitizer.escape(req.session.fullname),
          ismasterdatasteward: sanitizer.escape(req.session.ismasterdatasteward),
          isdatasteward: sanitizer.escape(req.session.isdatasteward),
          isreadonly: sanitizer.escape(req.session.isreadonly),
          searchkeyword: sanitizer.escape(req.session.searchkeyword),
        });
      } else {
        next(error);
      }
    });
  } catch (e) {
    next(e);
  }
}

function fetchproducts(req, res) {
  global.appServer.locals.title = 'myEEM CM Product Overview';
  const brandname = sanitizer.escape(req.query.brandname);
  const vendorid = sanitizer.escape(req.query.vendorid);
  const vid = sanitizer.escape(req.query.vid);
  let vendornamedata;
  let partnercode;
  let issystemgenerated;
  const brand = [];
  const productfamily = [];
  const producttype = [];
  const productcategory = [];
  const apiclassfication = [];
  let uniquebrand = [];
  let uniqueproductfamily = [];
  let uniqueproducttype = [];
  let uniqueproductcategory = [];
  let uniqueapiclassfication = [];
  let isMPorVN = false;
  let VSTerm = false;
  if (brandname !== '' && brandname != null && brandname !== undefined) {
    request.get(`${API_URL}/api/fetchsingleproducts?brandname=${brandname}&vid=${vid}`, options, (error, response, body) => {
      if (!error && response.statusCode === 200) {
        const result = JSON.parse(body);
        const { data } = result;
        if (data.length > 0) {
          for (let i = 0; i < data.length; i++) {
            vendornamedata = data[i].vendorname;
            ({ partnercode } = data[i]);
            if (data[i].issysgeneratedvendorcode !== null) {
              if (data[i].issysgeneratedvendorcode === true) {
                issystemgenerated = true;
              } else {
                issystemgenerated = false;
              }
            } else {
              issystemgenerated = false;
            }
            if (data[i].brandname !== null) {
              brand.push(data[i].brandname);
            }
            console.log('brandurl print here');
            console.log(data[i].brandurl);
            // if (data[i].brandurl == null) {
            //   data[i].brandurl = '/img/noimage.jpg';
            // }
            if (data[i].productfamily !== null) {
              productfamily.push(data[i].productfamily);
            }
            if (data[i].producttype !== null) {
              producttype.push(data[i].producttype);
            }
            if (data[i].productcategory !== null) {
              productcategory.push(data[i].productcategory);
            }
            if (data[i].apiclassification !== null) {
              apiclassfication.push(data[i].apiclassification);
            }
            if (data[0].vendorsearchterm !== undefined
              && data[0].vendorsearchterm !== null) {
              isMPorVN = true;
              console.log(data[0].vendorsearchterm);
              const vendorsearchterm = data[0].vendorsearchterm.split('/');
              console.log(data[0].vendorsearchterm);
              if (vendorsearchterm[1] === 'MP') {
                VSTerm = true;
              } else {
                VSTerm = false;
              }
            } else {
              isMPorVN = false;
            }
          }
          uniquebrand = (brand.filter(onlyUnique)).sort();
          console.log(uniquebrand);
          uniqueproductfamily = (productfamily.filter(onlyUnique)).sort();
          uniqueproducttype = (producttype.filter(onlyUnique)).sort();
          uniqueproductcategory = (productcategory.filter(onlyUnique)).sort();
          uniqueapiclassfication = (apiclassfication.filter(onlyUnique)).sort();
        }
        res.render('products', {
          layout: 'main',
          bn: uniquebrand,
          pf: uniqueproductfamily,
          pt: uniqueproducttype,
          pc: uniqueproductcategory,
          ac: uniqueapiclassfication,
          data: result.data,
          isMPorVN,
          isMP: VSTerm,
          vendorname: vendornamedata,
          vendorcode: partnercode,
          systemgen: issystemgenerated,
          vendordetails: vid,
          fullname: sanitizer.escape(req.session.fullname),
          ismasterdatasteward: sanitizer.escape(req.session.ismasterdatasteward),
          isdatasteward: sanitizer.escape(req.session.isdatasteward),
          isreadonly: sanitizer.escape(req.session.isreadonly),
          searchkeyword: sanitizer.escape(req.session.searchkeyword),
        });
      } else {
        console.log(error);
        res.send(error);
      }
    });
  }
  if (vendorid !== '' && vendorid != null && vendorid !== undefined) {
    request.get(`${API_URL}/api/fetchvendorproducts?vendorid=${vendorid}`, options, (error, response, body) => {
      if (!error && response.statusCode === 200) {
        const result = JSON.parse(body);
        const { data } = result;
        if (data.length > 0) {
          for (let i = 0; i < data.length; i++) {
            vendornamedata = data[i].vendorname;
            ({ partnercode } = data[i]);
            if (data[i].issysgeneratedvendorcode !== null) {
              if (data[i].issysgeneratedvendorcode === true) {
                issystemgenerated = true;
              } else {
                issystemgenerated = false;
              }
            } else {
              issystemgenerated = false;
            }
            if (data[i].brandname !== null) {
              brand.push(data[i].brandname);
            }
            console.log('brandurl print here');
            console.log(data[i].brandurl);
            // if (data[i].brandurl == null) {
            //   data[i].brandurl = '/img/noimage.jpg';
            // }
            if (data[i].productfamily !== null) {
              productfamily.push(data[i].productfamily);
            }
            if (data[i].producttype !== null) {
              producttype.push(data[i].producttype);
            }
            if (data[i].productcategory !== null) {
              productcategory.push(data[i].productcategory);
            }
            if (data[i].apiclassification !== null) {
              apiclassfication.push(data[i].apiclassification);
            }
            if (data[0].vendorsearchterm !== undefined
              && data[0].vendorsearchterm !== null) {
              isMPorVN = true;
              console.log(data[0].vendorsearchterm);
              const vendorsearchterm = data[0].vendorsearchterm.split('/');
              console.log(data[0].vendorsearchterm);
              if (vendorsearchterm[1] === 'MP') {
                VSTerm = true;
              } else {
                VSTerm = false;
              }
            } else {
              isMPorVN = false;
            }
          }
          uniquebrand = brand.filter(onlyUnique);
          console.log(uniquebrand);
          uniqueproductfamily = productfamily.filter(onlyUnique);
          uniqueproducttype = producttype.filter(onlyUnique);
          uniqueproductcategory = productcategory.filter(onlyUnique);
          uniqueapiclassfication = (apiclassfication.filter(onlyUnique));
        }
        res.render('products', {
          layout: 'main',
          bn: uniquebrand,
          pf: uniqueproductfamily,
          pt: uniqueproducttype,
          pc: uniqueproductcategory,
          ac: uniqueapiclassfication,
          data: result.data,
          isMPorVN,
          isMP: VSTerm,
          vendorname: vendornamedata,
          vendorcode: partnercode,
          systemgen: issystemgenerated,
          vendordetails: vendorid,
          fullname: sanitizer.escape(req.session.fullname),
          ismasterdatasteward: sanitizer.escape(req.session.ismasterdatasteward),
          isdatasteward: sanitizer.escape(req.session.isdatasteward),
          isreadonly: sanitizer.escape(req.session.isreadonly),
          searchkeyword: sanitizer.escape(req.session.searchkeyword),
        });
      } else {
        console.log(error);
        res.send(error);
      }
    });
  }
}

function search(req, res) {
  global.appServer.locals.title = 'myEEM Search';
  let keywords = sanitizer.escape(req.query.keywords);
  // v2:: start
  let islandingpage;
  if (keywords === undefined) {
    islandingpage = true;
    keywords = '';
  } else {
    islandingpage = false;
  }
  // global.appServer.locals.searchkeyword = keywords;
  console.log('islandingpage', islandingpage);
  req.session.searchkeyword = keywords;
  // if (!islandingpage) {
  request.get(`${API_URL}/api/searchcm?keywords=${keywords}`, options, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      const result = JSON.parse(body);
      const { data } = result;
      console.log('data**********************', data);
      const hubregion = [];
      const vendorstatus = [];
      const vendortype = [];
      const servicecategory = [];
      let mfgtech = [];
      let brandname = [];
      const cmsegmentation = [];
      // v2:: variable hseCategory  start
      const hserisk = []; // v2:: hse category variable added for filter
      let uniquehserisk = []; // v2:: unique category variable added for filter
      // v2:: variable end
      let uniquehubregion = [];
      let uniquevendorstatus = [];
      let uniquevendortype = [];
      let uniqueservicecategory = [];
      let uniquemfgtech = [];
      let uniquebrandname = [];
      let uniquecmsegmentation = [];

      for (let i = 0; i < data.length; i++) {
        // v2:: hse_risk - start
        if (data[i].hse_risk !== null) {
          hserisk.push(data[i].hse_risk);
        }
        // v2:: hse_risk - end
        if (data[i].general_huboversight !== null) {
          hubregion.push(data[i].general_huboversight);
        }
        if (data[i].supply_vendorstatus !== null) {
          vendorstatus.push(data[i].supply_vendorstatus);
        }
        if (data[i].general_vendortype !== null) {
          vendortype.push(data[i].general_vendortype);
        }
        if (data[i].general_servicetype !== null) {
          servicecategory.push(data[i].general_servicetype);
        }
        if (data[i].brandname !== null) {
          brandname = brandname.concat(data[i].brandname.split(','));
        }
        if (data[i].ts_mfgtech !== null) {
          const mfgvalues = data[i].ts_mfgtech.split(',');
          mfgtech = mfgtech.concat(data[i].ts_mfgtech.split(','));
          data[i].ts_mfgtech = mfgvalues.join(' | ');
        }
        if (data[i].general_cmsegmentation !== null) {
          cmsegmentation.push(data[i].general_cmsegmentation);
        }
        if (data[i].supply_contractexpiration !== null) {
          data[i].supply_contractexpiration = moment(data[i].supply_contractexpiration).format('DD-MMM-YYYY');
        }
        if (data[i].quality_approvaldate !== null) {
          data[i].quality_approvaldate = moment(data[i].quality_approvaldate).format('DD-MMM-YYYY');
        }
        if (data[i].quality_reviewdate !== null) {
          data[i].quality_reviewdate = moment(data[i].quality_reviewdate).format('DD-MMM-YYYY');
        }
        if (data[i].quality_qtasigneddate !== null) {
          data[i].quality_qtasigneddate = moment(data[i].quality_qtasigneddate).format('DD-MMM-YYYY');
        }
        if (data[i].quality_gqaauditdate !== null) {
          data[i].quality_gqaauditdate = moment(data[i].quality_gqaauditdate).format('DD-MMM-YYYY');
        }
        if (data[i].hse_mostrecentsurvey !== null) {
          data[i].hse_mostrecentsurvey = moment(data[i].hse_mostrecentsurvey).format('DD-MMM-YYYY');
        }
        if (data[i].hse_mostrecentassessment !== null) {
          data[i].hse_mostrecentassessment = moment(data[i].hse_mostrecentassessment).format('DD-MMM-YYYY');
        }
        if (data[i].hse_nextscheudleassessment !== null) {
          data[i].hse_nextscheudleassessment = moment(data[i].hse_nextscheudleassessment).format('DD-MMM-YYYY');
        }
        if (data[i].supply_contractnotinplace !== null) {
          if (data[i].supply_contractnotinplace === true) {
            data[i].supply_contractnotinplace = 'Yes';
          } else {
            data[i].supply_contractnotinplace = 'No';
          }
        }
        if (data[i].quality_qtanotinplace !== null) {
          if (data[i].quality_qtanotinplace === true) {
            data[i].quality_qtanotinplace = 'Yes';
          } else {
            data[i].quality_qtanotinplace = 'No';
          }
        }

        if (data[i].issysgeneratedvendorcode) {
          console.log('vendor is sys generated');
          data[i].reviewstatus = false;
        } else {
          console.log('vendor is NOT sys generated');
          if (data[i].general_vendortype !== null
            && (data[i].general_vendortype.toLowerCase() === 'cm'
              || data[i].general_vendortype.toLowerCase() === 'cm and supplier'
              || data[i].general_vendortype.toLowerCase() === 'api cm'
              || data[i].general_vendortype.toLowerCase() === 'api supplier'
              || data[i].general_vendortype.toLowerCase() === 'api cm and supplier')) {
            console.log('vendor is of desired vendor type');
            if (data[i].supply_vendorstatus !== null
              && (data[i].supply_vendorstatus.toLowerCase() === 'ongoing operations'
                || data[i].supply_vendorstatus.toLowerCase() === 'in termination')) {
              console.log('vendor is of desired vendor status');
              if (data[i].reviewstatus !== null && data[i].reviewstatus.toLowerCase() === 'closed') {
                console.log('vendor review closed');
                data[i].reviewscore = (parseFloat(data[i].reviewscore) / 20).toFixed(2);
                data[i].qualityreviewscore = (parseFloat(data[i].qualityreviewscore) / 4)
                .toFixed(2);
                data[i].procurementreviewscore = (parseFloat(data[i].procurementreviewscore) / 4)
                .toFixed(2);
                data[i].supplychainreviewscore = (parseFloat(data[i].supplychainreviewscore) / 4)
                .toFixed(2);
                data[i].tsmsreviewscore = (parseFloat(data[i].tsmsreviewscore) / 4).toFixed(2);
                data[i].hsereviewscore = (parseFloat(data[i].hsereviewscore) / 4).toFixed(2);
                data[i].reviewstatus = true;
              } else {
                console.log('vendor review NOT closed');
                data[i].reviewstatus = false;
              }
            } else {
              console.log('vendor is NOT of desired vendor status');
              data[i].reviewstatus = false;
            }
          } else {
            console.log('vendor is NOT of desired vendor type');
            data[i].reviewstatus = false;
          }
        }
      }
      // end of for loop above

      uniquehubregion = (hubregion.filter(onlyUnique)).sort();
      uniquevendorstatus = (vendorstatus.filter(onlyUnique)).sort();
      uniquevendortype = (vendortype.filter(onlyUnique)).sort();
      uniqueservicecategory = (servicecategory.filter(onlyUnique)).sort();
      uniquemfgtech = (mfgtech.filter(onlyUnique)).sort();
      uniquebrandname = (brandname.filter(onlyUnique)).sort();
      uniquecmsegmentation = (cmsegmentation.filter(onlyUnique)).sort();
      // v2:: uniquehserisk added start
      uniquehserisk = (hserisk.filter(onlyUnique)).sort();
      console.log('uniquehserisk************', uniquehserisk);
      // v2:: uniquehserisk added end
      if (keywords === '') {
        keywords = 'All CMs';
      }
      res.render('search', {
        data,
        uniquehubregion,
        uniquevendorstatus,
        uniquevendortype,
        uniqueservicecategory,
        uniquemfgtech,
        uniquebrandname,
        uniquecmsegmentation,
        uniquehserisk, // v2:: uniqueHseCategory added
        keywords,
        islandingpage,
        layout: 'main',
        fullname: sanitizer.escape(req.session.fullname),
        ismasterdatasteward: sanitizer.escape(req.session.ismasterdatasteward),
        isdatasteward: sanitizer.escape(req.session.isdatasteward),
        isreadonly: sanitizer.escape(req.session.isreadonly),
      });
    } else {
      console.log(error);
      res.send(error);
    }
  });
  // } else {
  //   res.render('search', {
  //     islandingpage,
  //     layout: 'main',
  //     fullname: sanitizer.escape(req.session.fullname),
  //     ismasterdatasteward: sanitizer.escape(req.session.ismasterdatasteward),
  //     isdatasteward: sanitizer.escape(req.session.isdatasteward),
  //     isreadonly: sanitizer.escape(req.session.isreadonly),
  //   });
  // }
  // v2:: end
}

// External vendor landing page
function externallandingpage(req, res, userdetail) {
  try {
    // const vendorId = req.query.vendorid;
    const vendorId = userdetail.metafield1;
    request.post({
      url: `${API_URL}/api/externalvendordetail`,
      headers: {
        'content-type': 'application/json',
        Authorization: auth,
      },
      json: {
        jsonData: vendorId,
      },
    }, (error, response, body) => {
      if (!error && response.statusCode === 200) {
        cfClient.getEntries({
          content_type: 'externalLink',
          locale: 'en-US',
          include: '2',
        }).then((entries) => {
          const content = [];
          for (let i = 0; i < entries.items.length; i++) {
            const entry = entries.items[i];
            const externalLandingPage = new utilities.externalLandingPage();
            externalLandingPage.title = entry.fields.title;
            externalLandingPage.logo = entry.fields.logo.fields.file.url;
            externalLandingPage.url = entry.fields.url;
            externalLandingPage.description = entry.fields.description;

            if (entry.fields.isComingSoon === false) {
              externalLandingPage.displaysection = true;
            } else {
              externalLandingPage.isComingSoon = entry.fields.isComingSoon;
              externalLandingPage.displaysection = false;
            }
            content.push(externalLandingPage);
          }
          res.render('externallandingpage', {
            externalcontent: content,
            vendordetail: body.data,
            userdetail,
            externalemail: sanitizer.escape(req.session.emailAddress),
            layout: false,
          });
        });
      } else {
        console.log(error);
      }
    });
  } catch (e) {
    console.log(e);
  }
}

function savecmoverview(req, res, next) {
  try {
    console.log('before sanitizer');
    console.log(req.body.jsonData);
    const obj = (req.body.jsonData);
    console.log('after sanitizer');
    console.log(obj);
    console.log('hseleadername*********', obj.hseleadername);
    console.log('hse leader email**************', obj.hseleaderemail);
    console.log('Full name**************', obj.username);
    request.post({
      url: `${API_URL}/api/savecmoverview`,
      json: true,
      headers: {
        'content-type': 'application/json',
        Authorization: auth,
      },
      body: obj,
    }, (error, response) => {
      if (!error && response.statusCode === 200) {
        request.post({
          url: `${APIURL}/api/modifybymetadfield1usermaster`,
          json: true,
          headers: {
            Authorization: `Basic ${reqheadercredential}`,
            'Content-Type': 'application/json',
          },
          body: {
            metafield1: obj[0].vendorid,
            metafield2: obj[0].vendorname,
            metafield3: obj[0].operationalleadername,
            metafield4: obj[0].operationalleaderemail,
            metafield5: obj[0].jptleadername,
            metafield6: obj[0].jptleaderemail,
            metafield7: obj[0].huboversightname,
            metafield8: obj[0].partnercode,
            changedby: null,
          },
        });
        res.send('updated overview');
      } else {
        next(error);
      }
    });
  } catch (e) {
    next(e);
  }
}

function cmoverviewdata(req, res) {
  global.appServer.locals.title = 'myEEM CM Overview';
  console.log('hi***************************');
  const vendorid = sanitizer.escape(req.query.vendorid);
  const userid = sanitizer.escape(req.session.userid);
  const fullname = sanitizer.escape(req.session.fullname);
  const VendorStatusArray = [];
  const SelVendorStatusArray = [];
  const ServiceTypeArray = [];
  const SelServiceType = [];
  const VendorTypeArray = [];
  const SelVendorType = [];
  const CmSegArray = [];
  const SelCmSeg = [];
  const MfgTechArray = [];
  const SupplyScopeArray = [];
  const SelSupplyScope = [];
  const HubOversightArray = [];
  const Selhub = [];
  const VolumeCommitmentArray = [];
  const SelVolumeCommitmentArray = [];
  const TechnicalRiskArray = [];
  const SelTechnicalRisk = [];
  const ProductionScopeArray = [];
  const HSECertiArray = [];
  const AvailCertiArray = [];
  const DosageFormsArray = [];
  const HSECategoryArray = [];
  const HSERiskArray = [];
  const SelHSERisk = [];
  const SelHSECategory = [];
  const AddServicesArray = [];
  const QualityRiskArray = [];
  const SelQualityrisk = [];
  const SelQualityAvailCert = [];
  let isupdatecmoverview = 0;
  let isMPorVN = false;
  let VSTerm = false;
  request.get({
    url: `${API_URL}/api/dropdownvalues`,
    headers: {
      'content-type': 'application/json',
      Authorization: auth,
    },
    json: true,
  }, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      const { data } = body;
      for (let i = 0; i < data.length; i++) {
        if (data[i].dropdowncategory === 'Vendor Status') {
          VendorStatusArray.push({
            Id: data[i].dropdownid,
            Value: data[i].dropdownvalue,
          });
        }
        if (data[i].dropdowncategory === 'Vendor Type') {
          VendorTypeArray.push({
            Id: data[i].dropdownid,
            Value: data[i].dropdownvalue,
          });
        }
        if (data[i].dropdowncategory === 'Service Type') {
          ServiceTypeArray.push({
            Id: data[i].dropdownid,
            Value: data[i].dropdownvalue,
          });
        }
        if (data[i].dropdowncategory === 'CM Segmentation') {
          CmSegArray.push({
            Id: data[i].dropdownid,
            Value: data[i].dropdownvalue,
          });
        }
        if (data[i].dropdowncategory === 'Manufacturing Technology') {
          MfgTechArray.push({
            Id: data[i].dropdownid,
            Value: data[i].dropdownvalue,
          });
        }
        if (data[i].dropdowncategory === 'Available Certification') {
          AvailCertiArray.push({
            Id: data[i].dropdownid,
            Value: data[i].dropdownvalue,
          });
        }
        if (data[i].dropdowncategory === 'Dosage Forms') {
          DosageFormsArray.push({
            Id: data[i].dropdownid,
            Value: data[i].dropdownvalue,
          });
        }
        if (data[i].dropdowncategory === 'Hub Oversight') {
          HubOversightArray.push({
            Id: data[i].dropdownid,
            Value: data[i].dropdownvalue,
          });
        }
        if (data[i].dropdowncategory === 'Production Scope') {
          ProductionScopeArray.push({
            Id: data[i].dropdownid,
            Value: data[i].dropdownvalue,
          });
        }
        if (data[i].dropdowncategory === 'Technical Risk') {
          TechnicalRiskArray.push({
            Id: data[i].dropdownid,
            Value: data[i].dropdownvalue,
          });
        }
        if (data[i].dropdowncategory === 'Supply Scope') {
          SupplyScopeArray.push({
            Id: data[i].dropdownid,
            Value: data[i].dropdownvalue,
          });
        }
        if (data[i].dropdowncategory === 'HSE Certifications') {
          HSECertiArray.push({
            Id: data[i].dropdownid,
            Value: data[i].dropdownvalue,
          });
        }
        if (data[i].dropdowncategory === 'HSE Category') {
          HSECategoryArray.push({
            Id: data[i].dropdownid,
            Value: data[i].dropdownvalue,
          });
        }
        if (data[i].dropdowncategory === 'HSE Risk') {
          HSERiskArray.push({
            Id: data[i].dropdownid,
            Value: data[i].dropdownvalue,
          });
        }
        if (data[i].dropdowncategory === 'Volume Commitment') {
          VolumeCommitmentArray.push({
            Id: data[i].dropdownid,
            Value: data[i].dropdownvalue,
          });
        }
        if (data[i].dropdowncategory === 'Additional Services') {
          AddServicesArray.push({
            Id: data[i].dropdownid,
            Value: data[i].dropdownvalue,
          });
        }
        if (data[i].dropdowncategory === 'Quality Risk') {
          QualityRiskArray.push({
            Id: data[i].dropdownid,
            Value: data[i].dropdownvalue,
          });
        }
      }
      request.get({
        url: `${API_URL}/api/cmoverviewdata?vendorid=${vendorid}`,
        headers: {
          'content-type': 'application/json',
          Authorization: auth,
        },
        json: true,
      }, (err, resp, content) => {
        if (content.data[0] !== undefined) {
          isupdatecmoverview = 1;
          const selectedhserisk = content.data[0].hse_risk;
          const selectedhsecategory = content.data[0].hse_category;
          const selectedvendortype = content.data[0].general_vendortype;
          const reviewyear = moment(content.data[0].reviewyear).format('DD-MMM-YYYY');
          const reviewyearsel = moment(content.data[0].reviewyear).format('YYYY');
          const reviewscore = (parseFloat(content.data[0].reviewscore) / 20).toFixed(2);
          const qualityreviewscore = (parseFloat(content.data[0].qualityreviewscore)
            / 4).toFixed(2);
          const procurementreviewscore = (parseFloat(content.data[0].procurementreviewscore)
            / 4).toFixed(2);
          const supplychainreviewscore = (parseFloat(content.data[0].supplychainreviewscore)
            / 4).toFixed(2);
          const tsmsreviewscore = (parseFloat(content.data[0].tsmsreviewscore) / 4).toFixed(2);
          const hsereviewscore = (parseFloat(content.data[0].hsereviewscore) / 4).toFixed(2);
          const { reviewstatus } = content.data[0];
          const selectedhubid = content.data[0].general_huboversight;
          let isreviewstatus = false;
          if (content.data[0].issysgeneratedvendorcode) {
            console.log('vendor is sys generated');
            isreviewstatus = false;
          } else {
            console.log('vendor is NOT sys generated');
            console.log(content.data[0].excelgeneral_vendortype);
            if (content.data[0].excelgeneral_vendortype !== null
              && ((content.data[0].excelgeneral_vendortype).toLowerCase() === 'cm'
                || (content.data[0].excelgeneral_vendortype).toLowerCase() === 'cm and supplier'
                || (content.data[0].excelgeneral_vendortype).toLowerCase() === 'api cm'
                || (content.data[0].excelgeneral_vendortype).toLowerCase() === 'api supplier'
                || (content.data[0].excelgeneral_vendortype).toLowerCase() === 'api cm and supplier')) {
              console.log('vendor is of desired vendor type');
              if (content.data[0].excelsupply_vendorstatus !== null
                && ((content.data[0].excelsupply_vendorstatus).toLowerCase() === 'ongoing operations'
                  || (content.data[0].excelsupply_vendorstatus).toLowerCase() === 'in termination')) {
                console.log('vendor is of desired vendor status');
                if (reviewstatus !== null && reviewstatus.toLowerCase() === 'closed') {
                  console.log('review status true');
                  isreviewstatus = true;
                } else {
                  console.log('review status false', reviewstatus);
                  isreviewstatus = false;
                }
              } else {
                console.log('vendor is NOT of desired vendor status');
                isreviewstatus = false;
              }
            } else {
              console.log('vendor is NOT of desired vendor type');
              isreviewstatus = false;
            }
          }
          console.log('start of review here....');
          console.log(reviewyear);
          console.log(reviewyearsel);
          console.log(selectedhubid);
          console.log(reviewscore);
          console.log(qualityreviewscore);
          console.log(procurementreviewscore);
          console.log(supplychainreviewscore);
          console.log(tsmsreviewscore);
          console.log(hsereviewscore);
          console.log(reviewstatus);
          console.log('end of review here....');
          console.log('Vendor Search Term....');

          console.log(content.data[0].vendorsearchterm);
          console.log('general_jptleader****',content.data[0].general_jptleader);
          console.log('quality_leaderemail****',content.data[0].quality_leaderemail);
          const newdate = moment(content.data[0].modifieddate).format('MM/DD/YYYY');
          if (content.data[0].vendorsearchterm !== undefined
            && content.data[0].vendorsearchterm !== null) {
            isMPorVN = true;
            console.log(content.data[0].vendorsearchterm);
            const vendorsearchterm = content.data[0].vendorsearchterm.split('/');
            console.log(content.data[0].vendorsearchterm);
            if (vendorsearchterm[1] === 'MP') {
              VSTerm = true;
            } else {
              VSTerm = false;
            }
          } else {
            isMPorVN = false;
          }
          const selectedcmsegmentation = content.data[0].general_cmsegmentation;
          const selectedvolumecommitment = content.data[0].supply_volumecommitment;
          const selectedtechnicalrisk = content.data[0].ts_technicalrisk;
          const selectedhub = content.data[0].general_huboversight;
          const selectedqualityrisk = content.data[0].quality_risk;
          const selectedsupplyscope = content.data[0].supply_supplyscope;
          const selectedvendorstatus = content.data[0].supply_vendorstatus;
          const selectedservicetype = content.data[0].general_servicetype;
          const contractexpdate = moment(content.data[0].supply_contractexpiration).format('MM/DD/YYYY');
          const agreementapprovaldate = moment(content.data[0].quality_approvaldate).format('MM/DD/YYYY');
          const agreementreveiewdate = moment(content.data[0].quality_reviewdate).format('MM/DD/YYYY');
          const qtasigneddate = moment(content.data[0].quality_qtasigneddate).format('MM/DD/YYYY');
          let gqaaudit = '';
          let hsesurvey = '';
          let hserecentassesment = '';
          let hsenextassesment = '';
          let selectedqualityavailcert = '';
          let operationaleadername = '';
          let qualityleadername = '';
          let jptleadername = '';
          // v2:: hseleader and tsmsleader name variable created - start
          let hseleadername = '';
          let tsmsleadername = '';
          // v2:: hseleader and tsmsleader name variable created - end
          const generaloperationalleader = content.data[0].general_operationalleader;
          const generaloperationalleaderemail = content.data[0].general_operationalleaderemail;
          const generaljptleader = content.data[0].general_jptleader;
          const generaljptleaderemail = content.data[0].general_jptleaderemail;
          const qualityleader = content.data[0].quality_leader;
          const qualityleaderemail = content.data[0].quality_leaderemail;
          // v2:: hse and tsms leader name and email start
          const hseleader = content.data[0].hse_leader;
          const hseleaderemail = content.data[0].hse_leaderemail;
          const tsmsleader = content.data[0].tsms_leader;
          const tsmsleaderemail = content.data[0].tsms_leaderemail;
          // v2:: hse and tsms leader name and email end
          if (generaloperationalleader !== null && generaloperationalleader !== '') {
            const operationalleader = generaloperationalleader.split(',');
            const operationalleaderemail = generaloperationalleaderemail.split(',');
            const opleader = [];
            for (let i = 0; i < operationalleader.length; i++) {
              opleader.push(`${operationalleader[i]}| ${operationalleaderemail[i]}`);
            }
            operationaleadername = opleader.join(',');
          }
          if (generaljptleader !== null && generaljptleader !== '') {
            const jptleaderdata = generaljptleader.split(',');
            const jptleaderemail = generaljptleaderemail.split(',');
            const jpleader = [];
            for (let i = 0; i < jptleaderdata.length; i++) {
              jpleader.push(`${jptleaderdata[i]}| ${jptleaderemail[i]}`);
            }
            jptleadername = jpleader.join(',');
          }
          if (qualityleader !== null && qualityleader !== '') {
            const qualityleaderdata = qualityleader.split(',');
            const qualityemail = qualityleaderemail.split(',');
            const qleader = [];
            for (let i = 0; i < qualityleaderdata.length; i++) {
              qleader.push(`${qualityleaderdata[i]}| ${qualityemail[i]}`);
            }
            qualityleadername = qleader.join(',');
          }
          // v2 :: if condition for hseleader and tsmsleader start
          if (hseleader !== null && hseleader !== '') {
            console.log('inside if hseleader');
            const hseleaderdata = hseleader.split(',');
            const hseemail = hseleaderemail.split(',');
            const hsleader = [];
            for (let i = 0; i < hseleaderdata.length; i++) {
              hsleader.push(`${hseleaderdata[i]}| ${hseemail[i]}`);
            }
            hseleadername = hsleader.join(',');
            console.log('hse leader name and email', hseleadername);
          }

          if (tsmsleader !== null && tsmsleader !== '') {
            console.log('inside if tsmsleader');
            const tsmsleaderdata = tsmsleader.split(',');
            const tsmsemail = tsmsleaderemail.split(',');
            const tsleader = [];
            for (let i = 0; i < tsmsleaderdata.length; i++) {
              tsleader.push(`${tsmsleaderdata[i]}| ${tsmsemail[i]}`);
            }
            tsmsleadername = tsleader.join(',');
            console.log('tsms leader name and email', hseleadername);
          }
          // v2 :: if condition for hseleader and tsmsleader end
          if (content.data[0].quality_availablecertifications !== null) {
            selectedqualityavailcert = content.data[0].quality_availablecertifications.split(',');
          }
          if (content.data[0].quality_gqaauditdate !== '' || content.data[0].quality_gqaauditdate !== null || content.data[0].quality_gqaauditdate !== undefined) {
            gqaaudit = moment(content.data[0].quality_gqaauditdate).format('MM/DD/YYYY');
          }
          if (content.data[0].hse_mostrecentsurvey !== '' || content.data[0].hse_mostrecentsurvey !== null || content.data[0].hse_mostrecentsurvey !== undefined) {
            hsesurvey = moment(content.data[0].hse_mostrecentsurvey).format('MM/DD/YYYY');
          }
          if (content.data[0].hse_mostrecentassessment !== '' || content.data[0].hse_mostrecentassessment !== null || content.data[0].HSE_MostRecentAssessment !== undefined) {
            hserecentassesment = moment(content.data[0].hse_mostrecentassessment).format('MM/DD/YYYY');
          }
          if (content.data[0].hse_nextscheudleassessment !== '' || content.data[0].hse_nextscheudleassessment !== null || content.data[0].HSE_NextScheudleAssessment !== undefined) {
            hsenextassesment = moment(content.data[0].hse_nextscheudleassessment).format('MM/DD/YYYY');
          }
          for (let i = 0; i < VendorStatusArray.length; i++) {
            if (VendorStatusArray[i].Id === selectedvendorstatus) {
              SelVendorStatusArray.push({
                Id: VendorStatusArray[i].Id,
                Value: VendorStatusArray[i].Value,
                Selected: true,
              });
            } else {
              SelVendorStatusArray.push({
                Id: VendorStatusArray[i].Id,
                Value: VendorStatusArray[i].Value,
                Selected: false,
              });
            }
          }
          for (let i = 0; i < VolumeCommitmentArray.length; i++) {
            if (VolumeCommitmentArray[i].Id === selectedvolumecommitment) {
              SelVolumeCommitmentArray.push({
                Id: VolumeCommitmentArray[i].Id,
                Value: VolumeCommitmentArray[i].Value,
                Selected: true,
              });
            } else {
              SelVolumeCommitmentArray.push({
                Id: VolumeCommitmentArray[i].Id,
                Value: VolumeCommitmentArray[i].Value,
                Selected: false,
              });
            }
          }
          for (let i = 0; i < HSERiskArray.length; i++) {
            if (HSERiskArray[i].Id === selectedhserisk) {
              SelHSERisk.push({
                Id: HSERiskArray[i].Id,
                Value: HSERiskArray[i].Value,
                Selected: true,
              });
            } else {
              SelHSERisk.push({
                Id: HSERiskArray[i].Id,
                Value: HSERiskArray[i].Value,
                Selected: false,
              });
            }
          }
          for (let i = 0; i < HSECategoryArray.length; i++) {
            if (HSECategoryArray[i].Id === selectedhsecategory) {
              SelHSECategory.push({
                Id: HSECategoryArray[i].Id,
                Value: HSECategoryArray[i].Value,
                Selected: true,
              });
            } else {
              SelHSECategory.push({
                Id: HSECategoryArray[i].Id,
                Value: HSECategoryArray[i].Value,
                Selected: false,
              });
            }
          }
          for (let i = 0; i < TechnicalRiskArray.length; i++) {
            if (TechnicalRiskArray[i].Id === selectedtechnicalrisk) {
              SelTechnicalRisk.push({
                Id: TechnicalRiskArray[i].Id,
                Value: TechnicalRiskArray[i].Value,
                Selected: true,
              });
            } else {
              SelTechnicalRisk.push({
                Id: TechnicalRiskArray[i].Id,
                Value: TechnicalRiskArray[i].Value,
                Selected: false,
              });
            }
          }
          for (let i = 0; i < VendorTypeArray.length; i++) {
            if (VendorTypeArray[i].Id === selectedvendortype) {
              SelVendorType.push({
                Id: VendorTypeArray[i].Id,
                Value: VendorTypeArray[i].Value,
                Selected: true,
              });
            } else {
              SelVendorType.push({
                Id: VendorTypeArray[i].Id,
                Value: VendorTypeArray[i].Value,
                Selected: false,
              });
            }
          }
          for (let i = 0; i < QualityRiskArray.length; i++) {
            if (QualityRiskArray[i].Id === selectedqualityrisk) {
              SelQualityrisk.push({
                Id: QualityRiskArray[i].Id,
                Value: QualityRiskArray[i].Value,
                Selected: true,
              });
            } else {
              SelQualityrisk.push({
                Id: QualityRiskArray[i].Id,
                Value: QualityRiskArray[i].Value,
                Selected: false,
              });
            }
          }
          for (let i = 0; i < SupplyScopeArray.length; i++) {
            if (SupplyScopeArray[i].Id === selectedsupplyscope) {
              SelSupplyScope.push({
                Id: SupplyScopeArray[i].Id,
                Value: SupplyScopeArray[i].Value,
                Selected: true,
              });
            } else {
              SelSupplyScope.push({
                Id: SupplyScopeArray[i].Id,
                Value: SupplyScopeArray[i].Value,
                Selected: false,
              });
            }
          }
          for (let i = 0; i < CmSegArray.length; i++) {
            if (CmSegArray[i].Id === selectedcmsegmentation) {
              SelCmSeg.push({
                Id: CmSegArray[i].Id,
                Value: CmSegArray[i].Value,
                Selected: true,
              });
            } else {
              SelCmSeg.push({
                Id: CmSegArray[i].Id,
                Value: CmSegArray[i].Value,
                Selected: false,
              });
            }
          }
          for (let i = 0; i < HubOversightArray.length; i++) {
            if (HubOversightArray[i].Id === selectedhub) {
              Selhub.push({
                Id: HubOversightArray[i].Id,
                Value: HubOversightArray[i].Value,
                Selected: true,
              });
            } else {
              Selhub.push({
                Id: HubOversightArray[i].Id,
                Value: HubOversightArray[i].Value,
                Selected: false,
              });
            }
          }
          for (let i = 0; i < ServiceTypeArray.length; i++) {
            if (ServiceTypeArray[i].Id === selectedservicetype) {
              SelServiceType.push({
                Id: ServiceTypeArray[i].Id,
                Value: ServiceTypeArray[i].Value,
                Selected: true,
              });
            } else {
              SelServiceType.push({
                Id: ServiceTypeArray[i].Id,
                Value: ServiceTypeArray[i].Value,
                Selected: false,
              });
            }
          }
          for (let i = 0; i < AvailCertiArray.length; i++) {
            if (selectedqualityavailcert.length > 0) {
              for (let j = 0; j < selectedqualityavailcert.length; j++) {
                if (AvailCertiArray[i].Id === selectedqualityavailcert[j]) {
                  SelQualityAvailCert.push({
                    Id: AvailCertiArray[i].Id,
                    Value: AvailCertiArray[i].Value,
                    Selected: true,
                  });
                } else {
                  SelQualityAvailCert.push({
                    Id: AvailCertiArray[i].Id,
                    Value: AvailCertiArray[i].Value,
                    Selected: false,
                  });
                }
              }
            }
          }
          request.get({
            url: `${API_URL}/api/branddetails?vendorid=${vendorid}`,
            headers: {
              'content-type': 'application/json',
              Authorization: auth,
            },
            json: true,
          }, (errr, respo, brandcontent) => {
            const branddata = brandcontent.data;
            const mainbrandaaray = [];

            for (let i = 0; i < branddata.length; i += 3) {
              const subbrandarray = [];
              for (let j = 0; j < 3 && j + i < branddata.length; j++) {
                subbrandarray.push(branddata[i + j]);
              }
              mainbrandaaray.push(subbrandarray);
            }

            const { ADGROUPUSERNAME } = process.env;
            const { ADGROUPPASSWORD } = process.env;
            const ADGROUP = `${ADGROUPUSERNAME}:${ADGROUPPASSWORD}`;
            let adgrpmemlist = '';
            const soaoptions = {
              uri: 'https://soa-d.xh1.lilly.com:8443/ad/groupMemberSystemIDs?groupSearchPattern=CONNECT_*&groupSearchPattern=MYEEM_DATASTEWARDS*',
              key: process.env.API_KEY,
              cert: process.env.API_CERT,
              passphrase: process.env.API_PASSPHRASE,
              // url:SearchURL1,
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
                const adgrpkey = 'CN=MYEEM_DATASTEWARDS,OU=Universal Groups,OU=Groups,DC=AM,DC=LILLY,DC=com';
                const adgrpmem = JSON.parse(adgrp);
                req.session.contributor = adgrpmem[adgrpkey];
                let adgrpQueryString = '';
                for (let i = 0; i < adgrpmem[adgrpkey].length; i++) {
                  if (i === adgrpmem[adgrpkey].length - 1) {
                    adgrpQueryString = `${adgrpQueryString}SystemLogonId eq '${adgrpmem[adgrpkey][i]}'`;
                  } else {
                    adgrpQueryString = `${adgrpQueryString}SystemLogonId eq '${adgrpmem[adgrpkey][i]}' or `;
                  }
                }
                const soaoptions1 = {
                  uri: `https://soa.lilly.com:8443/EMDM/v2/GWF_Workers?$filter=${adgrpQueryString}&$select=SystemLogonId,LastName,FirstName,MiddleName,InternetEmailAddress,StatusCode`,
                  key: process.env.API_KEY,
                  cert: process.env.API_CERT,
                  passphrase: process.env.API_PASSPHRASE,
                  // url:SearchURL1,
                  method: 'GET',
                  headers: {
                    Accept: 'application/json',
                    'Accept-Charset': 'utf-8',
                    'User-Agent': 'my-reddit-client',
                    Authorization: `Basic ${new Buffer.from(ADGROUP).toString('base64')}`,
                  },
                };
                rp(soaoptions1)
                  .then((adgrpFullResponse) => {
                    adgrpmemlist = adgrpFullResponse;
                  }).catch((err2) => {
                    console.log(err2);
                  });
              }).catch((err3) => {
                console.log(err3);
              });
            if (!error && res.statusCode === 200) {
              SelVolumeCommitmentArray.forEach((item) => {
                console.log(`${item.Id} : ${item.Selected}`);
              });
              let vendortypeselect = '';
              for (let i = 0; i < SelVendorType.length; i++) {
                if (SelVendorType[i].Selected === true) {
                  vendortypeselect = SelVendorType[i].Value.toLowerCase();
                  break;
                }
              }
              const vendorstatusselect = content.data[0].excelsupply_vendorstatus.toLowerCase();
              let isCheckServiceQuestion = false;
              let enableRiskDropdown = false;
              if (content.data[0].issysgeneratedvendorcode === false &&
                (vendortypeselect === 'cm' ||
                  vendortypeselect === 'cm and supplier' ||
                  vendortypeselect === 'api cm' ||
                  vendortypeselect === 'api supplier' ||
                  vendortypeselect === 'api cm and supplier') &&
                (vendorstatusselect === 'ongoing operations' ||
                  vendorstatusselect === 'in termination')) {
                isCheckServiceQuestion = true;
              } else {
                enableRiskDropdown = true;
              }
              /* PDF Creation Log*/
              const pdfObj = {};
              pdfObj.vendorname = content.data[0].vendorname;
              pdfObj.vendoraddress = content.data[0].vendoraddress;
              pdfObj.vendorcity = content.data[0].cityname;
              pdfObj.partnercode = content.data[0].partnercode;
              pdfObj.excelgeneral_huboversight = content.data[0].excelgeneral_huboversight;
              pdfObj.excelquality_risk = content.data[0].excelquality_risk;
              pdfObj.excelts_technicalrisk = content.data[0].excelts_technicalrisk;
              pdfObj.quality_availablecertifications =
                content.data[0].quality_availablecertifications;
              pdfObj.vendorregion = content.data[0].countryname;
              pdfObj.ts_mfgtech = content.data[0].ts_mfgtech;
              pdfObj.quality_qtanotinplace = content.data[0].quality_qtanotinplace;
              pdfObj.quality_qtasigneddate = content.data[0].quality_qtasigneddate;
              pdfObj.totalBrand = branddata.length;
              pdfObj.quality_gqaauditdate = content.data[0].quality_gqaauditdate;
              pdfObj.vendorType = content.data[0].general_vendortype;
              pdfObj.cmSegmentation = content.data[0].general_cmsegmentation;
              pdfObj.vendorid = content.data[0].vendorid;
              pdfObj.isCheckServiceQuestion = isCheckServiceQuestion;
              pdfObj.isMPorVN = isMPorVN;
              pdfObj.isMP = VSTerm;
              /* PDF End Log*/
              res.render('cmoverview', {
                layout: 'main',
                VendorStatus: SelVendorStatusArray,
                VendorType: SelVendorType,
                ServiceType: SelServiceType,
                CmSeg: SelCmSeg,
                MfgTech: MfgTechArray,
                AvailCerti: AvailCertiArray,
                DosageForms: DosageFormsArray,
                HSERisk: SelHSERisk,
                HSECategory: SelHSECategory,
                HSECerti: HSECertiArray,
                SupplyScope: SelSupplyScope,
                TechnicalRisk: SelTechnicalRisk,
                isMPorVN,
                isMP: VSTerm,
                ProductionScope: ProductionScopeArray,
                HubOversight: Selhub,
                AddServices: AddServicesArray,
                QualityRisk: SelQualityrisk,
                VolumeCommitment: VolumeCommitmentArray,
                SelVolumeCommitment: SelVolumeCommitmentArray,
                result: content.data,
                qleader: qualityleadername.trim(),
                jptleader: jptleadername.trim(),
                opleader: operationaleadername.trim(),
                // v2::start
                hsleader: hseleadername.trim(),
                tsleader: tsmsleadername.trim(),
                newdate,
                // v2::end
                userid,
                fullname,
                vendorid,
                brand: mainbrandaaray,
                contractexpdate,
                agreementapprovaldate,
                agreementreveiewdate,
                qtasigneddate,
                gqaaudit,
                hsesurvey,
                hserecentassesment,
                isupdate: isupdatecmoverview,
                hsenextassesment,
                adgrpmemlist,
                ismasterdatasteward: sanitizer.escape(req.session.ismasterdatasteward),
                isdatasteward: sanitizer.escape(req.session.isdatasteward),
                isreadonly: sanitizer.escape(req.session.isreadonly),
                searchkeyword: sanitizer.escape(req.session.searchkeyword),
                reviewyear,
                reviewyearsel,
                selectedhubid,
                reviewscore,
                qualityreviewscore,
                procurementreviewscore,
                supplychainreviewscore,
                tsmsreviewscore,
                hsereviewscore,
                reviewstatus,
                isreviewstatus,
                enableRiskDropdown,
                pdfObj: JSON.stringify(pdfObj),
              });
            } else {
              console.log(error);
              res.send(error);
            }
          });
        } else {
          isupdatecmoverview = 0;
          request.get(`${API_URL}/api/fetchsinglecmdetails?vendorid=${vendorid}`, options, (errormsg, responsemsg, bodymsg) => {
            if (!errormsg && responsemsg.statusCode === 200) {
              const result = JSON.parse(bodymsg);
              const cmdata = result.data;
              if (cmdata.length > 0) {
                const selectedhub = cmdata[0].general_huboversight;
                for (let i = 0; i < HubOversightArray.length; i++) {
                  if (HubOversightArray[i].Id === selectedhub) {
                    Selhub.push({
                      Id: HubOversightArray[i].Id,
                      Value: HubOversightArray[i].Value,
                      Selected: true,
                    });
                  } else {
                    Selhub.push({
                      Id: HubOversightArray[i].Id,
                      Value: HubOversightArray[i].Value,
                      Selected: false,
                    });
                  }
                }
                // V2 For first time data insert
                for (let i = 0; i < VolumeCommitmentArray.length; i++) {
                  SelVolumeCommitmentArray.push({
                    Id: VolumeCommitmentArray[i].Id,
                    Value: VolumeCommitmentArray[i].Value,
                    Selected: false,
                  });
                }
                // ENDS HERE
                console.log('Vendor Search Term isupdate0....');
                console.log(cmdata[0].vendorsearchterm);
                if (cmdata[0].vendorsearchterm !== undefined
                  && cmdata[0].vendorsearchterm !== null) {
                  isMPorVN = true;
                  console.log(cmdata[0].vendorsearchterm);
                  const vendorsearchterm = cmdata[0].vendorsearchterm.split('/');
                  console.log(cmdata[0].vendorsearchterm);
                  if (vendorsearchterm[1] === 'MP') {
                    VSTerm = true;
                  } else {
                    VSTerm = false;
                  }
                } else {
                  isMPorVN = false;
                }
                request.get({
                  url: `${API_URL}/api/branddetails?vendorid=${vendorid}`,
                  headers: {
                    'content-type': 'application/json',
                    Authorization: auth,
                  },
                  json: true,
                }, (errr, respo, brandcontent) => {
                  const branddata = brandcontent.data;
                  const mainbrandaaray = [];
                  if (branddata !== null && branddata.length > 0) {
                    for (let i = 0; i < branddata.length; i += 3) {
                      const subbrandarray = [];
                      for (let j = 0; j < 3 && j + i < branddata.length; j++) {
                        subbrandarray.push(branddata[i + j]);
                      }
                      mainbrandaaray.push(subbrandarray);
                    }
                  }
                  /* PDF obj*/
                  const pdfObj = {};
                  pdfObj.vendorname = cmdata[0].vendorname;
                  pdfObj.vendoraddress = cmdata[0].vendoraddress;
                  pdfObj.vendorcity = cmdata[0].cityname;
                  pdfObj.partnercode = cmdata[0].partnercode;
                  pdfObj.excelgeneral_huboversight = cmdata[0].excelgeneral_huboversight;
                  pdfObj.excelquality_risk = cmdata[0].excelquality_risk;
                  pdfObj.excelts_technicalrisk = cmdata[0].excelts_technicalrisk;
                  pdfObj.quality_availablecertifications =
                    cmdata[0].quality_availablecertifications;
                  pdfObj.vendorregion = cmdata[0].countryname;
                  pdfObj.ts_mfgtech = cmdata[0].ts_mfgtech;
                  pdfObj.quality_qtanotinplace = cmdata[0].quality_qtanotinplace;
                  pdfObj.quality_qtasigneddate = cmdata[0].quality_qtasigneddate;
                  pdfObj.totalBrand = branddata.length;
                  pdfObj.quality_gqaauditdate = cmdata[0].quality_gqaauditdate;
                  pdfObj.vendorType = cmdata[0].general_vendortype;
                  pdfObj.cmSegmentation = cmdata[0].general_cmsegmentation;
                  pdfObj.vendorid = cmdata[0].vendorid;
                  pdfObj.isCheckServiceQuestion = false;
                  pdfObj.isMPorVN = isMPorVN;
                  pdfObj.isMP = VSTerm;
                  /* */
                  res.render('cmoverview', {
                    layout: 'main',
                    VendorStatus: VendorStatusArray,
                    VendorType: VendorTypeArray,
                    ServiceType: ServiceTypeArray,
                    CmSeg: CmSegArray,
                    MfgTech: MfgTechArray,
                    AvailCerti: AvailCertiArray,
                    DosageForms: DosageFormsArray,
                    HSERisk: HSERiskArray,
                    HSECategory: HSECategoryArray,
                    HSECerti: HSECertiArray,
                    SupplyScope: SupplyScopeArray,
                    TechnicalRisk: TechnicalRiskArray,
                    isMPorVN,
                    isMP: VSTerm,
                    ProductionScope: ProductionScopeArray,
                    HubOversight: Selhub,
                    AddServices: AddServicesArray,
                    QualityRisk: QualityRiskArray,
                    VolumeCommitment: VolumeCommitmentArray,
                    SelVolumeCommitment: SelVolumeCommitmentArray,
                    result: cmdata,
                    vendorid,
                    brand: mainbrandaaray,
                    contractexpdate: null,
                    agreementapprovaldate: null,
                    agreementreveiewdate: null,
                    qtasigneddate: null,
                    gqaaudit: null,
                    hsesurvey: null,
                    hserecentassesment: null,
                    isupdate: isupdatecmoverview,
                    hsenextassesment: null,
                    enableRiskDropdown: true,
                    pdfObj: JSON.stringify(pdfObj),
                    fullname: sanitizer.escape(req.session.fullname),
                    ismasterdatasteward: sanitizer.escape(req.session.ismasterdatasteward),
                    isdatasteward: sanitizer.escape(req.session.isdatasteward),
                    isreadonly: sanitizer.escape(req.session.isreadonly),
                    searchkeyword: sanitizer.escape(req.session.searchkeyword),
                  });
                });
              }
            }
          });
        }
      });
    } else {
      console.log(error);
      res.send(error);
    }
  });
}

function exporttoexcel(req, res) {
  const vendorid = sanitizer.escape(req.query.vendorid);
  // Create a new instance of a Workbook class
  const workbook = new xl.Workbook();
  const worksheet = workbook.addWorksheet('Sheet 1');
  // nitin-start
  var style = workbook.createStyle({
    border: {
      left: {
        style: 'thin',
        color: '#000000'
      },
      right: {
        style: 'thin',
        color: '#000000'
      },
      top: {
        style: 'thin',
        color: '#000000'
      },
      bottom: {
        style: 'thin',
        color: '#000000'
      }
    }
    });
  // nitin-end
  // Add Worksheets to the workbook
  worksheet.cell(1, 1).string('Vendor Code').style(style);
  worksheet.cell(1, 2).string('Vendor Name').style(style);
  worksheet.cell(1, 3).string('CM Segmentation').style(style);
  worksheet.cell(1, 4).string('Service Type').style(style);
  worksheet.cell(1, 5).string('Hub Oversight').style(style);
  worksheet.cell(1, 6).string('Operational Leader').style(style);
  worksheet.cell(1, 7).string('JPT Leader').style(style);
  worksheet.cell(1, 8).string('General Comments').style(style);
  worksheet.cell(1, 9).string('Vendor Status').style(style);
  worksheet.cell(1, 10).string('Supply Scope').style(style);
  worksheet.cell(1, 11).string('Contract Expiration').style(style);
  worksheet.cell(1, 12).string('Volume Commitment').style(style);
  worksheet.cell(1, 13).string('Supply Chain Comments').style(style);
  worksheet.cell(1, 14).string('Quality Risk').style(style);
  worksheet.cell(1, 15).string('Initial QTA Signature Date').style(style);
  worksheet.cell(1, 16).string('Agreement Approval Date').style(style);
  worksheet.cell(1, 17).string('Agreement Review Date').style(style);
  worksheet.cell(1, 18).string('GQA Audit').style(style);
  worksheet.cell(1, 19).string('Available Certification').style(style);
  worksheet.cell(1, 20).string('Quality Leader').style(style);
  worksheet.cell(1, 21).string('Quality Comments').style(style);
  worksheet.cell(1, 22).string('Technical Risk').style(style);
  worksheet.cell(1, 23).string('Manufacturing Technology').style(style);
  worksheet.cell(1, 24).string('Additional Services').style(style);
  worksheet.cell(1, 25).string('Dosage Forms').style(style);
  worksheet.cell(1, 26).string('Production Scope').style(style);
  worksheet.cell(1, 27).string('Additional Comments on CM Production & Services').style(style);
  worksheet.cell(1, 28).string('HSE Risk').style(style);
  worksheet.cell(1, 29).string('HSE Category').style(style);
  worksheet.cell(1, 30).string('Most Recent HSE Survey').style(style);
  worksheet.cell(1, 31).string('Most Recent HSE Assessment').style(style);
  worksheet.cell(1, 32).string('Next Scheduled Assessment').style(style);
  worksheet.cell(1, 33).string('HSE Certification').style(style);
  worksheet.cell(1, 34).string('Supply Contract Not In Place').style(style);
  // v2:: start
  worksheet.cell(1, 35).string('HSE Leader').style(style);
  worksheet.cell(1, 36).string('TSMS Leader').style(style);
  worksheet.cell(1, 37).string('QTA Not In Place').style(style);
  worksheet.cell(1, 38).string('Last Updated By').style(style);
  worksheet.cell(1, 39).string('Last Updated Date').style(style);
  // v2:: end
  request.get({
    url: `${API_URL}/api/cmoverviewdata?vendorid=${vendorid}`,
    headers: {
      'content-type': 'application/json',
      Authorization: auth,
    },
    json: true,
  }, (err, resp, content) => {
    if (content.data[0] !== undefined) {
      worksheet.cell(2, 1).string(content.data[0].partnercode).style(style);
      worksheet.cell(2, 2).string(content.data[0].vendorname).style(style);
      if (content.data[0].excelgeneral_cmsegmentation !== null) {
        worksheet.cell(2, 3).string(content.data[0].excelgeneral_cmsegmentation).style(style);
      } else {
        worksheet.cell(2, 3).string(' ').style(style);
      }
      if (content.data[0].excelgeneral_servicetype !== null) {
        worksheet.cell(2, 4).string(content.data[0].excelgeneral_servicetype).style(style);
      } else {
        worksheet.cell(2, 4).string(' ').style(style);
      }
      if (content.data[0].excelgeneral_huboversight !== null) {
        worksheet.cell(2, 5).string(content.data[0].excelgeneral_huboversight).style(style);
      } else {
        worksheet.cell(2, 5).string(' ').style(style);
      }
      if (content.data[0].general_operationalleader !== null) {
        worksheet.cell(2, 6).string(content.data[0].general_operationalleader).style(style);
      } else {
        worksheet.cell(2, 6).string(' ').style(style);
      }
      if (content.data[0].general_jptleader !== null) {
        worksheet.cell(2, 7).string(content.data[0].general_jptleader).style(style);
      } else {
        worksheet.cell(2, 7).string(' ').style(style);
      }
      if (content.data[0].general_comments !== null) {
        worksheet.cell(2, 8).string(content.data[0].general_comments).style(style);
      } else {
        worksheet.cell(2, 8).string(' ').style(style);
      }
      if (content.data[0].excelsupply_vendorstatus !== null) {
        worksheet.cell(2, 9).string(content.data[0].excelsupply_vendorstatus).style(style);
      } else {
        worksheet.cell(2, 9).string(' ').style(style);
      }
      if (content.data[0].excelsupply_supplyscope !== null) {
        worksheet.cell(2, 10).string(content.data[0].excelsupply_supplyscope).style(style);
      } else {
        worksheet.cell(2, 10).string(' ').style(style);
      }
      if (content.data[0].supply_contractexpiration !== null) {
        worksheet.cell(2, 11).string(moment(content.data[0].supply_contractexpiration).format('MM/DD/YYYY')).style(style);
      } else {
        worksheet.cell(2, 11).string(' ').style(style);
      }
      if (content.data[0].excelsupply_volumecommitment !== null) {
        worksheet.cell(2, 12).string(content.data[0].excelsupply_volumecommitment).style(style);
      } else {
        worksheet.cell(2, 12).string(' ').style(style);
      }
      if (content.data[0].supply_volumecommitmentcomments !== null) {
        worksheet.cell(2, 13).string(content.data[0].supply_volumecommitmentcomments).style(style);
      } else {
        worksheet.cell(2, 13).string(' ').style(style);
      }
      if (content.data[0].excelquality_risk !== null) {
        worksheet.cell(2, 14).string(content.data[0].excelquality_risk).style(style);
      } else {
        worksheet.cell(2, 14).string(' ').style(style);
      }
      if (content.data[0].quality_qtasigneddate !== null) {
        worksheet.cell(2, 15).string(moment(content.data[0].quality_qtasigneddate).format('MM/DD/YYYY')).style(style);
      } else {
        worksheet.cell(2, 15).string(' ').style(style);
      }
      if (content.data[0].quality_approvaldate !== null) {
        worksheet.cell(2, 16).string(moment(content.data[0].quality_approvaldate).format('MM/DD/YYYY')).style(style);
      } else {
        worksheet.cell(2, 16).string(' ').style(style);
      }
      if (content.data[0].quality_reviewdate !== null) {
        worksheet.cell(2, 17).string(moment(content.data[0].quality_reviewdate).format('MM/DD/YYYY')).style(style);
      } else {
        worksheet.cell(2, 17).string(' ').style(style);
      }
      if (content.data[0].quality_gqaauditdate !== null) {
        worksheet.cell(2, 18).string(moment(content.data[0].quality_gqaauditdate).format('MM/DD/YYYY')).style(style);
      } else {
        worksheet.cell(2, 18).string(' ').style(style);
      }
      if (content.data[0].quality_availablecertifications !== null) {
        worksheet.cell(2, 19).string(content.data[0].quality_availablecertifications).style(style);
      } else {
        worksheet.cell(2, 19).string(' ').style(style);
      }
      if (content.data[0].quality_leader !== null) {
        worksheet.cell(2, 20).string(content.data[0].quality_leader).style(style);
      } else {
        worksheet.cell(2, 20).string(' ').style(style);
      }
      if (content.data[0].quality_comments !== null) {
        worksheet.cell(2, 21).string(content.data[0].quality_comments).style(style);
      } else {
        worksheet.cell(2, 21).string(' ').style(style);
      }
      if (content.data[0].excelts_technicalrisk !== null) {
        worksheet.cell(2, 22).string(content.data[0].excelts_technicalrisk).style(style);
      } else {
        worksheet.cell(2, 22).string(' ').style(style);
      }
      if (content.data[0].ts_mfgtech !== null) {
        worksheet.cell(2, 23).string(content.data[0].ts_mfgtech).style(style);
      } else {
        worksheet.cell(2, 23).string(' ').style(style);
      }
      if (content.data[0].ts_additionalservices !== null) {
        worksheet.cell(2, 24).string(content.data[0].ts_additionalservices).style(style);
      } else {
        worksheet.cell(2, 24).string(' ').style(style);
      }
      if (content.data[0].ts_dosageforms !== null) {
        worksheet.cell(2, 25).string(content.data[0].ts_dosageforms).style(style);
      } else {
        worksheet.cell(2, 25).string(' ').style(style);
      }
      if (content.data[0].ts_productionscope !== null) {
        worksheet.cell(2, 26).string(content.data[0].ts_productionscope).style(style);
      } else {
        worksheet.cell(2, 26).string(' ').style(style);
      }
      if (content.data[0].ts_additionalcomments !== null) {
        worksheet.cell(2, 27).string(content.data[0].ts_additionalcomments).style(style);
      } else {
        worksheet.cell(2, 27).string(' ').style(style);
      }
      if (content.data[0].excelhse_risk !== null) {
        worksheet.cell(2, 28).string(content.data[0].excelhse_risk).style(style);
      } else {
        worksheet.cell(2, 28).string(' ').style(style);
      }
      if (content.data[0].excelhse_category !== null) {
        worksheet.cell(2, 29).string(content.data[0].excelhse_category).style(style);
      } else {
        worksheet.cell(2, 29).string(' ').style(style);
      }
      if (content.data[0].hse_mostrecentsurvey !== null) {
        worksheet.cell(2, 30).string(moment(content.data[0].hse_mostrecentsurvey).format('MM/DD/YYYY')).style(style);
      } else {
        worksheet.cell(2, 30).string(' ').style(style);
      }
      if (content.data[0].hse_mostrecentassessment !== null) {
        worksheet.cell(2, 31).string(moment(content.data[0].hse_mostrecentassessment).format('MM/DD/YYYY')).style(style);
      } else {
        worksheet.cell(2, 31).string(' ').style(style);
      }
      if (content.data[0].hse_nextscheudleassessment !== null) {
        worksheet.cell(2, 32).string(moment(content.data[0].hse_nextscheudleassessment).format('MM/DD/YYYY')).style(style);
      } else {
        worksheet.cell(2, 32).string(' ').style(style);
      }
      if (content.data[0].hse_certifications !== null) {
        worksheet.cell(2, 33).string(content.data[0].hse_certifications).style(style);
      } else {
        worksheet.cell(2, 33).string(' ').style(style);
      }
      if (content.data[0].supply_contractnotinplace !== null) {
        if (content.data[0].supply_contractnotinplace === true) {
          worksheet.cell(2, 34).string('Yes').style(style);
        } else {
          worksheet.cell(2, 34).string('No').style(style);
        }
      } else {
        worksheet.cell(2, 33).string(' ').style(style);
      }
      // v2:: hse_leader and tsms_leader - start
      if (content.data[0].hse_leader !== null) {
        worksheet.cell(2, 35).string(content.data[0].hse_leader).style(style);
      } else {
        worksheet.cell(2, 35).string(' ').style(style);
      }
      if (content.data[0].tsms_leader !== null) {
        worksheet.cell(2, 36).string(content.data[0].tsms_leader).style(style);
      } else {
        worksheet.cell(2, 36).string(' ').style(style);
      }
      if (content.data[0].quality_qtanotinplace !== null) {
        if (content.data[0].quality_qtanotinplace === true) {
          worksheet.cell(2, 37).string('Yes').style(style);
        } else {
          worksheet.cell(2, 37).string('No').style(style);
        }
      } else {
        worksheet.cell(2, 37).string(' ').style(style);
      }
      if (content.data[0].modifiedby !== null) {
        worksheet.cell(2, 38).string(content.data[0].modifiedby).style(style);
      } else {
        worksheet.cell(2, 38).string(' ').style(style);
      }
      if (content.data[0].modifieddate !== null) {
        worksheet.cell(2, 39).string(moment(content.data[0].modifieddate).format('MM/DD/YYYY')).style(style);
      } else {
        worksheet.cell(2, 39).string(' ').style(style);
      }
      // v2:: hse_leader and tsms_leader - end
      workbook.write('CMOverview.xlsx', (wberr, status) => {
        if (!wberr) {
          res.sendFile('/app/CMOverview.xlsx', (errors) => {
            console.log(`---------- error downloading file: ${errors}`);
            console.log(status);
          });
        }
      });
    } else {
      workbook.write('CMOverview.xlsx', (wberr, status) => {
        if (!wberr) {
          res.sendFile('/app/CMOverview.xlsx', (errors) => {
            console.log(`---------- error downloading file: ${errors}`);
            console.log(status);
          });
        }
      });
    }
  });
}
// Compare CM screen - Compares the selected CM
function emaildata(rawdata) {
  return new Promise((resolve) => {
    const jptleaderemail30 = [];
    const jptleaderemail10 = [];
    const jptleaderemail = [];
    const qualityleaderemail = [];
    const qualityleaderemail30 = [];
    const qualityleaderemail10 = [];
    const nmusername = process.env.NODE_MAILER_USERNAME;
    const nmpassword = process.env.NODE_MAILER_PASSWORD;
    const transporter = nodemailer.createTransport({
      host: process.env.emailhost, // Office 365 server
      port: process.env.emailport, // secure SMTP
      secure: false,
      auth: {
        user: nmusername,
        pass: nmpassword,
      },
      // tls: {
      //   ciphers: 'SSLv3',
      // },
    });
    const currdate = moment(moment(), 'DD-MMM-YYYY');
    // FOR JPT LEADER
    if (rawdata.supply_contractexpiration !== '' || rawdata.supply_contractexpiration !== undefined) {
      if (rawdata.general_jptleaderemail !== '' || rawdata.general_jptleaderemail !== undefined) {
        const finalsupplycontractdate = moment(moment(new Date(rawdata.supply_contractexpiration)).format('DD-MMM-YYYY'));
        const difference = currdate.diff(finalsupplycontractdate, 'days');

        if (difference === 30) {
          jptleaderemail30.push({
            jptleadername: rawdata.general_jptleader,
            jptleaderemail: rawdata.general_jptleaderemail,
            contractexpiration: rawdata.supply_contractexpiration,
            vendorname: rawdata.vendorname,
          });
          // const emailhtml = `Hi ${rawdata.general_jptleader},</br></br>
          // Please note that ${rawdata.vendorname} is going to be expired
          // before on ${rawdata.supply_contractexpiration}
          // </br><br>*This is a system-generated email and is not monitored*</br><br>
          // Thanks,</br>Elanco myEEM Team`;
          // const mailoption = {
          //   from: process.env.sg_from_email, // As seen in email screenshot
          //   to: rawdata.general_jptleaderemail,
          //   subject: 'myEEM:Vendor going to be expired',
          //   html: emailhtml,
          // };
          // verify connection configuration
          transporter.verify((error, success) => {
            if (error) {
              console.log(error);
            } else {
              console.log(success);
            }
          });
          // transporter.sendMail(mailoption, (error, info) => {
          //   if (error) {
          //     console.log(error);
          //   } else {
          //     console.log(`Email sent: ${info.response}`);
          //   }
          // });
        }
        if (difference === 10) {
          jptleaderemail10.push({
            jptleadername: rawdata.general_jptleader,
            jptleaderemail: rawdata.general_jptleaderemail,
            contractexpiration: rawdata.supply_contractexpiration,
            vendorname: rawdata.vendorname,
          });
          // const emailhtml = `Hi ${rawdata.general_jptleader},</br></br>
          // Please note that ${rawdata.vendorname} is going to be expired
          // before on ${rawdata.supply_contractexpiration}</br><br>
          // *This is a system-generated email and is not monitored*</br><br>
          // Thanks,</br>Elanco myEEM Team`;
          // const mailoption = {
          //   from: process.env.sg_from_email, // As seen in email screenshot
          //   to: rawdata.general_jptleaderemail,
          //   subject: 'myEEM:Vendor going to be expired',
          //   html: emailhtml,
          // };
          // transporter.sendMail(mailoption, (error, info) => {
          //   if (error) {
          //     console.log(error);
          //   } else {
          //     console.log(`Email sent: ${info.response}`);
          //   }
          // });
        }

        if (finalsupplycontractdate > currdate) {
          jptleaderemail.push({
            jptleadername: rawdata.general_jptleader,
            jptleaderemail: rawdata.general_jptleaderemail,
            contractexpiration: rawdata.supply_contractexpiration,
            vendorname: rawdata.vendorname,
          });
          // const emailhtml = `Hi ${rawdata.general_jptleader},</br></br>
          // Please note that ${rawdata.vendorname} is going to be
          // expired before on ${rawdata.supply_contractexpiration}</br><br>
          // *This is a system-generated email and is not monitored*</br><br>
          // Thanks,</br>Elanco myEEM Team`;
          // const mailoption = {
          //   from: process.env.sg_from_email, // As seen in email screenshot
          //   to: rawdata.general_jptleaderemail,
          //   subject: 'myEEM:Vendor going to be expired',
          //   html: emailhtml,
          // };
          // transporter.sendMail(mailoption, (error, info) => {
          //   if (error) {
          //     console.log(error);
          //   } else {
          //     console.log(`Email sent: ${info.response}`);
          //   }
          // });
        }
      }
    }
    // FOR QUALITY LEADER
    if (rawdata.quality_reviewdate !== '' || rawdata.quality_reviewdate !== undefined) {
      if (rawdata.quality_leaderemail !== '' || rawdata.quality_leaderemail !== undefined) {
        const qualityreviewdate = moment(moment(new Date(rawdata.quality_reviewdate)).format('DD-MMM-YYYY'));
        const difference = currdate.diff(qualityreviewdate, 'days');
        console.log('vendorname...');
        console.log(rawdata.vendorname);
        console.log('currdate...');
        console.log(currdate);
        console.log('qualityreviewdate...');
        console.log(qualityreviewdate);
        console.log('difference...');
        console.log(difference);
        if (difference === 30) {
          console.log('30 days.....');
          qualityleaderemail30.push({
            qualityleadername: rawdata.quality_leader,
            qualityleaderemail: rawdata.quality_leaderemail,
            qualityreviewdate: rawdata.quality_reviewdate,
            vendorname: rawdata.vendorname,
          });
          // const emailhtml = `Hi ${rawdata.quality_leader},</br></br>
          // Please note that ${rawdata.vendorname} is going to be expired before on
          // ${rawdata.quality_reviewdate}</br><br>
          // *This is a system-generated email and is not monitored*</br><br>
          // Thanks,</br>Elanco myEEM Team`;
          // const mailoption = {
          //   from: process.env.sg_from_email, // As seen in email screenshot
          //   to: rawdata.quality_leaderemail,
          //   subject: 'myEEM:Vendor going to be expired',
          //   html: emailhtml,
          // };
          // transporter.sendMail(mailoption, (error, info) => {
          //   if (error) {
          //     console.log(error);
          //   } else {
          //     console.log(`Email sent: ${info.response}`);
          //   }
          // });
        }
        if (difference === 10) {
          console.log('10 days.....');
          qualityleaderemail10.push({
            qualityleadername: rawdata.quality_leader,
            qualityleaderemail: rawdata.quality_leaderemail,
            qualityreviewdate: rawdata.quality_reviewdate,
            vendorname: rawdata.vendorname,
          });
          // const emailhtml = `Hi ${rawdata.quality_leader},</br></br>
          // Please note that ${rawdata.vendorname} is going to be expired before on
          // ${rawdata.quality_reviewdate}</br><br>
          // *This is a system-generated email and is not monitored*</br><br>
          // Thanks,</br>Elanco myEEM Team`;
          // const mailoption = {
          //   from: process.env.sg_from_email, // As seen in email screenshot
          //   to: rawdata.quality_leaderemail,
          //   subject: 'myEEM:Vendor going to be expired',
          //   html: emailhtml,
          // };
          // transporter.sendMail(mailoption, (error, info) => {
          //   if (error) {
          //     console.log(error);
          //   } else {
          //     console.log(`Email sent: ${info.response}`);
          //   }
          // });
        }
        if (qualityreviewdate > currdate) {
          console.log('expired.....');
          qualityleaderemail.push({
            qualityleadername: rawdata.quality_leader,
            qualityleaderemail: rawdata.quality_leaderemail,
            qualityreviewdate: rawdata.quality_reviewdate,
            vendorname: rawdata.vendorname,
          });
          // const emailhtml = `Hi ${rawdata.quality_leader},</br></br>
          // Please note that ${rawdata.vendorname} is going to be expired before on
          // ${rawdata.quality_reviewdate}</br><br>
          // *This is a system-generated email and is not monitored*</br><br>3
          // Thanks,</br>Elanco myEEM Team`;
          // const mailoption = {
          //   from: process.env.sg_from_email, // As seen in email screenshot
          //   to: rawdata.quality_leaderemail,
          //   subject: 'myEEM:Vendor going to be expired',
          //   html: emailhtml,
          // };
          // verify connection configuration
          transporter.verify((error, success) => {
            if (error) {
              console.log(error);
            } else {
              console.log(success);
            }
          });
          // transporter.sendMail(mailoption, (error, info) => {
          //   if (error) {
          //     console.log(error);
          //   } else {
          //     console.log(`Email sent: ${info.response}`);
          //   }
          // });
        }
      }
    }
    resolve();
  });
}

function email(req, res) {
  try {
    const promiseArray = [];
    request.get(`${API_URL}/api/emaildetails`, options, (error, response, body) => {
      const result = JSON.parse(body);
      const { data } = result;
      if (data.length > 0) {
        for (let i = 0; i < data.length; i++) {
          promiseArray.push(emaildata(data[i]));
        }
        res.send();
      }
    });
  } catch (e) {
    console.log(e);
  }
}

function emailtest(req, res) {
  const nmusername = process.env.NODE_MAILER_USERNAME;
  const nmpassword = process.env.NODE_MAILER_PASSWORD;
  const transporter = nodemailer.createTransport({
    host: process.env.emailhost, // Office 365 server
    port: process.env.emailport, // secure SMTP
    secure: false,
    auth: {
      user: nmusername,
      pass: nmpassword,
    },
    // tls: {
    //   ciphers: 'SSLv3',
    // },
  });
  // const emailhtml = 'Hi Test Data';
  // const mailoption = {
  //   from: process.env.sg_from_email, // As seen in email screenshot
  //   to: process.env.sg_to_email,
  //   subject: 'myEEM:Vendor going to be expired',
  //   html: emailhtml,
  // };
  // verify connection configuration
  console.log(req);
  console.log(res);
  transporter.verify((error, success) => {
    if (error) {
      console.log(error);
    } else {
      console.log(success);
    }
  });
  // transporter.sendMail(mailoption, (error, info) => {
  //   if (error) {
  //     console.log(error);
  //     res.send();
  //   } else {
  //     console.log(`Email sent: ${info.response}`);
  //     res.send();
  //   }
  // });
}

function sendexternalemail(req, res) {
  const { APPLICATION_URL } = process.env;
  const nmusername = process.env.NODE_MAILER_USERNAME;
  const vendorname = req.body.metafield2;
  const jptleader = req.body.metafield5;
  const operationalleader = req.body.metafield3;
  const fname = req.session.firstName;
  const lname = req.session.lastName;
  const emailaddress = req.session.emailAddress;
  const nmpassword = process.env.NODE_MAILER_PASSWORD;
  const toemailsend = `${req.body.metafield4},${req.body.metafield6}`;
  const emaildetails = `${req.session.emailAddress}${'&10'}${'&'}${fname}${'&'}${lname}`;
  const rejectemaildetails = `${req.session.emailAddress}${'&11'}${'&'}${fname}${'&'}${lname}`;
  const useremaildetails = new Buffer.from(emaildetails).toString('base64');
  const rejectuseremaildetails = new Buffer.from(rejectemaildetails).toString('base64');
  const transporter = nodemailer.createTransport({
    host: process.env.emailhost, // Office 365 server
    port: process.env.emailport, // secure SMTP
    secure: false,
    auth: {
      user: nmusername,
      pass: nmpassword,
    },
    // tls: {
    //   ciphers: 'SSLv3',
    // },
  });
  const emailhtml = `<html>
  <body>
      Hi ${operationalleader} or ${jptleader},
      <br />
      <br /> The Following Partner User has registered on myEEM portal and requires your approval <b><u>${fname} ${lname}</u></b> of
      ${vendorname}
      <br />
      <br /> ${emailaddress}
      <br />
      <br /> Click on the appropriate link to grant your external partner access:
      <a href='${APPLICATION_URL}/approveext?useremaildetails=${useremaildetails}'><b><u>APPROVE</u></b></a> or
      <a href='${APPLICATION_URL}/approveext?useremaildetails=${rejectuseremaildetails}'><b><u>REJECT</u></b></a>
      <br />
      <br />
      <b>
          Note:
          <i>
              ***Your approval signature ascertains that you have verified the user as a genuine Elanco Partner requiring access to myEEM
              portal. If unsure please DO NOT approve and contact your Elanco Partner directly to verify the authenticity of
              the registration.***
          </i>
      </b>
      <br />
      <br />
      <br />
      Thanks & Regards, <br />
      Elanco myEEM Team <br /><br />
    <img alt="myEEM Logo" style="float:right;" src="${APPLICATION_URL}/img/Myeem-logo.png" />
  </body>

  </html>`;

  const mailoption = {
    from: process.env.sg_from_email, // As seen in email screenshot
    to: toemailsend,
    subject: 'myEEM:Approve External Vendor',
    html: emailhtml,
  };
  transporter.sendMail(mailoption, (error, info) => {
    if (error) {
      console.log(error);
    } else {
      console.log(`Email sent: ${info.response}`);
      res.send({
        issuccess: true,
      });
    }
  });
}

module.exports = {
  getcms,
  fetchActiveCM,
  login,
  createcm,
  createnewcm,
  updatecm,
  updatenewcm,
  cmmetrics,
  fetchcmdata,
  fetchcmmetrics,
  savecmmetrics,
  comparecm,
  fetchproducts,
  search,
  externallandingpage,
  savecmoverview,
  cmoverviewdata,
  exporttoexcel,
  email,
  emailtest,
  sendexternalemail,
  // v2:: start
  // fetchVendorType,
  // v2:: end
  servicereview,
  fetchcmdataforservicereview,
  fetchServicereviewData,
  saveservicereview,
};
