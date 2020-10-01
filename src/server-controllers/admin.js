const moment =require('moment');

const request = require('request');
const contentful = require('contentful');
const sdk = require('contentful-management');
const fs = require('fs');
const formidable = require('formidable');
const sanitizer = require('sanitizer');
const utilities = require('./Utilities');
const { json } = require('body-parser');

const API_URL = process.env.MYEEM_API_URL;
const username = process.env.MYEEM_API_USERNAME;
const password = process.env.MYEEM_API_PASSWORD;
const auth = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
const options = {
  headers: {
    Authorization: auth,
  },
};

function managecm(req, res) {
  global.appServer.locals.title = 'myEEM Manage CM';
  try {
    request.get(`${API_URL}/api/managecm`, options, (error, response, body) => {
      if (!error && response.statusCode === 200) {
        const result = JSON.parse(body);
        res.render('adminmanagecm', {
          data: result.data,
          layout: 'adminmain',
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
  } catch (e) {
    console.log(e);
    res.render('error');
  }
}

function updateactivestatus(req, res, next) {
  try {
    const obj = req.query.array;
    request.post({
      url: `${API_URL}/api/updateactivestatus`,
      httpAgent: 'http://proxy.gtm.lilly.com:9000',
      httpsAgent: 'http://proxy.gtm.lilly.com:9000',
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        Authorization: auth,
      },
      json: { jsonData: obj },
    }, (error, response) => {
      if (!error && response.statusCode === 200) {
        res.send('success');
      } else {
        next(error);
      }
    });
  } catch (e) {
    next(e);
  }
}

function updateoverviewstatus(req, res, next) {
  try {
    const obj = req.query.jsonData;
    request.post({
      url: `${API_URL}/api/updateoverviewstatus`,
      json: true,
      headers: {
        'content-type': 'application/json',
        Authorization: auth,
      },
      body: obj,
    }, (error, response) => {
      if (!error && response.statusCode === 200) {
        res.send('updated overview');
      } else {
        console.log(error);
        next(error);
      }
    });
  } catch (e) {
    next(e);
  }
}

// Dropdown Code
function fetchDropdownCategory(req, res, next) {
  global.appServer.locals.title = 'myEEM Update Fields';
  try {
    request.get(`${API_URL}/api/fetchdropdowncategory`, options, (error, response, body) => {
      if (!error && response.statusCode === 200) {
        const result = JSON.parse(body);
        res.render('adminupdatefields', {
          data: result.data,
          layout: 'adminmain',
          fullname: sanitizer.escape(req.session.fullname),
          ismasterdatasteward: sanitizer.escape(req.session.ismasterdatasteward),
          isdatasteward: sanitizer.escape(req.session.isdatasteward),
          isreadonly: sanitizer.escape(req.session.isreadonly),
        });
      } else {
        next(error);
      }
    });
  } catch (e) {
    next(e);
  }
}

// v2:: start
function fetchServiceFunction(req, res, next) {
  const VendorTypeArray = [];
  const CmSegArray = [];
  // const ServiceTypeArray = [];
  const ServiceReviewFunction = ['Quality', 'Procurement', 'Supply Chain', 'TS/MS', 'HSE'];
  global.appServer.locals.title = 'myEEM manage service review';
  try {
    request.get(`${API_URL}/api/dropdownvalues`, options, (error, response, body) => {
      if (!error && response.statusCode === 200) {
        const result = JSON.parse(body);
        const { data } = result;
        for (let i = 0; i < data.length; i++) {
          if (data[i].dropdowncategory === 'Vendor Type'
            && (data[i].dropdownvalue === 'CM' || data[i].dropdownvalue === 'API CM'
             || data[i].dropdownvalue === 'CM AND SUPPLIER' || data[i].dropdownvalue === 'API CM AND SUPPLIER'
             || data[i].dropdownvalue === 'API SUPPLIER' || data[i].dropdownvalue === 'SUPPLIER')) {
            VendorTypeArray.push({ Id: data[i].dropdownid, Value: data[i].dropdownvalue });
          }
          if (data[i].dropdowncategory === 'CM Segmentation') {
            CmSegArray.push({ Id: data[i].dropdownid, Value: data[i].dropdownvalue });
          }
          // if (data[i].dropdowncategory === 'Service Type') {
          //   ServiceTypeArray.push({ Id: data[i].dropdownid, Value: data[i].dropdownvalue });
          // }
        }
        res.render('manageservicereview', {
          data,
          ServiceReviewFunction,
          VendorType: JSON.stringify(VendorTypeArray),
          vendortype: VendorTypeArray,
          CmSeg: JSON.stringify(CmSegArray),
          cmseg: CmSegArray,
          // ServiceType: JSON.stringify(ServiceTypeArray),
          // servicetype: ServiceTypeArray,
          layout: 'adminmain',
          fullname: sanitizer.escape(req.session.fullname),
          ismasterdatasteward: sanitizer.escape(req.session.ismasterdatasteward),
          isdatasteward: sanitizer.escape(req.session.isdatasteward),
          isreadonly: sanitizer.escape(req.session.isreadonly),
        });
      } else {
        next(error);
      }
    });
  } catch (e) {
    next(e);
  }
}

function FetchServiceReviewFunction(req, res, next) {
  try {
    const currentYear = req.query.currentYear;
    request.get(`${API_URL}/api/fetchservicereviewfunction?currentYear=${currentYear}`, options, (error, response, body) => {
      if (!error && response.statusCode === 200) {
        res.send(body);
      } else {
        next(error);
      }
    });
  } catch (e) {
    next(e);
  }
}

// GET ALL CMS THAT ARE ELIGIBLE FOR SERVICE REVIEW
function ServiceReviewCmDetails(req, res, next) {
  global.appServer.locals.title = 'myEEM service review track CMs';
  const currentYear = new Date().getFullYear();
  try {
    request.get(`${API_URL}/api/fetchservicereviewcmdetails?currentyear=${currentYear}`, options, (error, response, body) => {
      if (!error && response.statusCode === 200) {
        const result = JSON.parse(body);
        res.render('trackreviews', {
          data: JSON.stringify(result.data),
          layout: 'adminmain',
          fullname: sanitizer.escape(req.session.fullname),
          ismasterdatasteward: sanitizer.escape(req.session.ismasterdatasteward),
          isdatasteward: sanitizer.escape(req.session.isdatasteward),
          isreadonly: sanitizer.escape(req.session.isreadonly),
        });
      } else {
        console.log(error);
        next(error);
      }
    });
  } catch (e) {
    console.log(e);
    next(e);
  }
}

// CHANGE SERVICE REVIEW STATUS IN myEEM_ServiceReview_mst table to reopen service review window
function ChangeServiceReviewStatus(req, res, next) {
  const { vendorId } = req.query;
  console.log('vendorId*************', vendorId);
  try {
    request({
      url: `${API_URL}/api/updateservicereviewcmdetail/${vendorId}`,
      method: 'PUT',
      headers: {
        'content-type': 'application/json',
        Authorization: auth,
      },
    }, (error, response) => {
      if (!error && response.statusCode === 200) {
        res.send('Service review reopened');
      } else {
        next(error);
      }
    });
  } catch (e) {
    next(e);
  }
}

// v2:: end

function fetchDropdownItem(req, res, next) {
  try {
    const { dropdowncategory } = req.query;
    request.get(`${API_URL}/api/fetchdropdownitem?dropdowncategory=${dropdowncategory}`, options, (error, response, body) => {
      if (!error && response.statusCode === 200) {
        res.send(body);
      } else {
        next(error);
      }
    });
  } catch (e) {
    next(e);
  }
}

function addDropdownItem(req, res, next) {
  try {
    console.log("inside addropdownitem"+req.body.dropdowncategory+"  "+req.body.dropdownvalue+" ");
    request({
      
      url: `${API_URL}/api/adddropdownitem`,
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        Authorization: auth,
      },
      json: {
        dropdowncategory: req.body.dropdowncategory,
        dropdownvalue: req.body.dropdownvalue,
        createdby: sanitizer.escape(req.session.userid),
      },
    }, (error, response) => {
      if (!error && response.statusCode === 200) {
        console.log("response.statusCode "+response.statusCode );
        res.send('added');
        console.log("responce added sucessfully");
      } else {
        next(error);
        console.log("responce added sucessfully"+error);
      }
    });
  } catch (e) {
    next(e);
    console.log("responce added sucessfully"+e);
  }
}

// Code for fetch review window for current year
function fetchReviewWindow(req, res, next) {
  const currentyear = req.body.year;
  try {
    request({
      url: `${API_URL}/api/fetchreviewwindow`,
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        Authorization: auth,
      },
      json: {
        currentyear,
      },
    }, (error, response, body) => {
      if (!error && response.statusCode === 200) {
        console.log('SUCCESS IN SERVER API CALL--------------');
        console.log(body);
        res.send(body);
      } else {
        console.log('ERROR IN SERVER API CALL--------------');
        console.log('body', body);
        res.send(body);
        // next(error);
      }
    });
  } catch (e) {
    console.log('ERROR OUTSIDE SERVER API CALL--------------');
    next(e);
  }
}
// Code for Save review window for current year
function saveReviewWindow(req, res, next) {
  const { reviewStartDate } = req.body;
  const { reviewEndDate } = req.body;
  const { currentYear } = req.body;
  const formattedStart = moment(reviewStartDate).format('DD-MMM-YYYY');
  const formattedEnd = moment(reviewEndDate).format('DD-MMM-YYYY');
  try {
    request({
      url: `${API_URL}/api/savereviewwindow`,
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        Authorization: auth,
      },
      json: {
        startdate: formattedStart,
        enddate: formattedEnd,
        modifiedby: sanitizer.escape(req.session.fullname),
        currentYear,
      },
    }, (error, response, body) => {
      if (!error && response.statusCode === 200) {
        console.log('SUCCESS IN SERVER API CALL--------------');
        res.send(body);
      } else {
        console.log('ERROR IN SERVER API CALL--------------');
        next(error);
      }
    });
  } catch (e) {
    console.log('ERROR OUTSIDE SERVER API CALL--------------');
    next(e);
  }
}
// v2:: start
function addNewServiceItem(req, res, next) {
  try {
    request({
      url: `${API_URL}/api/addnewserviceitem`,
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        Authorization: auth,
      },
      json: {
        serviceReviewFunction: req.body.serviceReviewFunction,
        vendorType: req.body.vendorType,
        cmSegmentation: req.body.cmSegmentation,
        serviceItemValue: req.body.serviceItemValue,
        serviceDescription: req.body.serviceDescription,
        yearPicker: req.body.yearPicker,
        servicestartyear: new Date().getFullYear(),
        createdBy: sanitizer.escape(req.session.fullname),
        modifiedBy: sanitizer.escape(req.session.fullname),
      },
    }, (error, response) => {
      console.log('API Response -----');
      console.log(response.status);
      console.log(response.body);
      if (!error) {
        // res.send('added');
        res.status(200)
        .send({
          status: 'added',
          message: 'Added dropdown Item',
        });
      } else {
        next(error);
      }
    });
  } catch (e) {
    next(e);
  }
}
// v2::end

function deleteDropdownItem(req, res, next) {
  try {
    const { dropdownId } = req.params;
    request.put(`${API_URL}/api/deletedropdownitem/${dropdownId}`, options, (error, response) => {
      if (!error && response.statusCode === 200) {
        res.send('deleted');
      } else {
        next(error);
      }
    });
  } catch (e) {
    next(e);
  }
}
// v2:: start
function deleteServiceItem(req, res, next) {
  const { manageservicereviewId } = req.params;
  try {
    request({
      url: `${API_URL}/api/deleteserviceitem/${manageservicereviewId}`,
      method: 'PUT',
      headers: {
        'content-type': 'application/json',
        Authorization: auth,
      },
      json: {
        modifiedby: sanitizer.escape(req.session.fullname),
      },
    }, (error, response) => {
      if (!error && response.statusCode === 200) {
        res.send('deleted');
      } else {
        next(error);
      }
    });
  } catch (e) {
    next(e);
  }
}

function editServiceItem(req, res, next) {
  try {
    const { manageservicereviewId } = req.params;
    const data = req.body.newdata;
    const { dropdownStatus } = req.body;
    const { dropdownVendorType } = req.body;
    const { dropdownCmSeg } = req.body;
    // const { dropdownServiceType } = req.body;

    request({
      url: `${API_URL}/api/editserviceitem/${manageservicereviewId}`,
      method: 'PUT',
      headers: {
        'content-type': 'application/json',
        Authorization: auth,
      },
      json: {
        serviceitem: data[0],
        servicedescription: data[1],
        dropdownStatus,
        dropdownVendorType,
        dropdownCmSeg,
        // dropdownServiceType,
        modifiedby: sanitizer.escape(req.session.fullname),
      },
    }, (error, response) => {
      if (!error && response.statusCode === 200) {
        res.send('updated');
      } else {
        next(error);
      }
    });
  } catch (e) {
    next(e);
  }
}
// v2:: end
function editDropdownItem(req, res, next) {
  try {
    const { dropdownId } = req.params;
    request({
      url: `${API_URL}/api/editdropdownitem/${dropdownId}`,
      method: 'PUT',
      headers: {
        'content-type': 'application/json',
        Authorization: auth,
      },
      json: {
        dropdownvalue: req.body.dropdownvalue,
        modifiedby: sanitizer.escape(req.session.userid),
      },
    }, (error, response) => {
      if (!error && response.statusCode === 200) {
        res.send('updated');
      } else {
        next(error);
      }
    });
  } catch (e) {
    next(e);
  }
}
// End of Dropdown Code
function manageProduct(req, res, next) {
  try {
    global.appServer.locals.title = 'myEEM Manage Products';
    request.get(`${API_URL}/api/fetchproductdetails`, options, (error, response, body) => {
      if (!error && response.statusCode === 200) {
        const result = JSON.parse(body);
        res.render('adminmanageproducts', {
          data: result.data,
          layout: 'adminmain',
          fullname: sanitizer.escape(req.session.fullname),
          ismasterdatasteward: sanitizer.escape(req.session.ismasterdatasteward),
          isdatasteward: sanitizer.escape(req.session.isdatasteward),
          isreadonly: sanitizer.escape(req.session.isreadonly),
        });
      }
    });
  } catch (e) {
    next(e);
  }
}
function saveImageInContentful(req, res, next) {
  let imgpath;
  let fileName;
  // let brandId;
  let brandname;
  let contentType;
  const form = new formidable.IncomingForm();
  form.parse(req, (err, fields, files) => {
    imgpath = files.brandImage.path;
    ({ fileName } = fields);
    // brandId = fields.brandId;
    brandname = fields.brandname.replace('/', '&#x2F');
    contentType = `image/${imgpath.split('.').pop()}`;

    const spaceId = process.env.CONTENTFUL_SPACEID;
    const accessToken = process.env.CONTENTFUL_MANAGEMENTTOKEN;
    const cfClient = contentful.createClient({
      // This is the space ID. A space is like a project folder in Contentful terms
      space: process.env.CONTENTFUL_SPACEID,
      // This is the access token for this space.
      // Normally you get both ID and the token in the Contentful web app
      accessToken: process.env.CONTENTFUL_ACCESSTOKEN,
      httpAgent: utilities.createProxyAgent(),
      httpsAgent: utilities.createProxyAgent(),
    });
    const sdkClient = sdk.createClient({
      // This is the space ID. A space is like a project folder in Contentful terms
      spaceId,
      // This is the access token for this space.
      // Normally you get both ID and the token in the Contentful web app
      accessToken,
      httpAgent: utilities.createProxyAgent(),
      httpsAgent: utilities.createProxyAgent(),
    });
    sdkClient.getSpace(spaceId).then((space) => {
      return space.createUpload({
        file: fs.createReadStream(imgpath),
        contentType,
        fileName,
      })
        .then((upload) => {
          return space.createAsset({
            fields: {
              title: {
                'en-US': fileName,
              },
              file: {
                'en-US': {
                  fileName,
                  contentType,
                  uploadFrom: {
                    sys: {
                      type: 'Link',
                      linkType: 'Upload',
                      id: upload.sys.id,
                    },
                  },
                },
              },
            },
          })
            .then((asset) => {
              return asset.processForLocale('en-US', { processingCheckWait: 2000 });
            })
            .then((asset) => {
              return asset.publish();
            })
            .then((asset) => {
              cfClient.getAsset(asset.sys.id)
                .then((response) => {
                  try {
                    request({
                      // url: `${API_URL}/api/uploadbrandlogo/${brandId}`,
                      url: `${API_URL}/api/uploadbrandlogo/${brandname}`,
                      method: 'PUT',
                      headers: {
                        'content-type': 'application/json',
                        Authorization: auth,
                      },
                      json: { brandurl: response.fields.file.url },
                    }, (error, resp) => {
                      if (!error && resp.statusCode === 200) {
                        res.redirect('/adminupdateproducts');
                      } else {
                        next(error);
                      }
                    });
                  } catch (e) {
                    next(e);
                  }
                }).catch((err2) => {
                  res.send(err2);
                });
            });
        })
        .catch((err2) => {
          next(err2);
        });
    })
      .catch((err2) => {
        next(err2);
      });
  });
}

module.exports = {
  fetchDropdownCategory,
  fetchDropdownItem,
  addDropdownItem,
  deleteDropdownItem,
  editDropdownItem,
  updateoverviewstatus,
  updateactivestatus,
  managecm,
  manageProduct,
  saveImageInContentful,
  // v2:: start
  fetchServiceFunction,
  FetchServiceReviewFunction,
  ServiceReviewCmDetails,
  ChangeServiceReviewStatus,
  addNewServiceItem,
  fetchReviewWindow,
  saveReviewWindow,
  deleteServiceItem,
  editServiceItem,
  // v2:: end
};
