/**
 * agnitio.js
 *
 * The Agnitio Content API
 * Documentation can be found at:
 * http://wiki.agnitio.com/index.php/Agnitio_Content_API_(iPad)
 *
 * @author     Stefan Liden
 * @copyright  Copyright 2012 Agnitio
 */

(function () {
    
  // Is script running on iOS device?
  var api_version = '1.0',
      ua = navigator.userAgent,
     // From: http://davidwalsh.name/detect-ipad
     isiPad = /iPad/i.test(ua) || /iPhone OS 3_1_2/i.test(ua) || /iPhone OS 3_2_2/i.test(ua),
     isSafari = ua.match(/Safari/i) != null,
     isiPlanner = isiPad && !isSafari;

  // Invoke iPlanner public method
  function calliPlanner (api, params) {
    var invokeString, iFrame;
    if (isiPlanner) {
      invokeString = "objc://iplanner/" + api + "?" + encodeURIComponent(params),
      iFrame = document.createElement("IFRAME");
      iFrame.setAttribute("src", invokeString);
      document.body.appendChild(iFrame); 
      iFrame.parentNode.removeChild(iFrame);
      iFrame = null;
    }
  }
    
  // Create the global Agnitio namespace 'ag'
  window.ag = window.ag || {};

  /***********************************************************
  *
  * Call built-in iPlanner functionality
  *
  ***********************************************************/

  /**
   * Capture canvas image (i.e. signature) from presentation. 
   * @public     
   * @param options object   
   */
  ag.captureImage = function (options) {
    var params = {
      directCall: options.directCall || true,
      imageData: options.imageData || '',
      imageDescription: options.imageDescription || null,
      signatory: options.signatory || null,
      signatoryEmail: options.signatoryEmail || null,
      emailRecipients: options.emailRecipients || null,
      emailSubject: options.emailSubject || null,
      emailBody: options.emailBody || null
    },
    args;
    if (isiPlanner) {
      args = JSON.stringify(params);
      calliPlanner('sigCapture', args);
    }
  }

  /**
   * Close presentation in iPlanner.
   * NOTE: normally double-clicking presentation is used
   * !!!: This is currently not working in the iPlanner
   * @public     
   */
  // ag.closePresentation = function () {
  //   if (isiPlanner) {
  //     calliPlanner('closePresentation', '');
  //   }
  // }

  /**
   * Opens PDF in iPlanner or browser
   * If name is included it will also monitor document
   * @public     
   * @param path string   
   * @param name string OPTIONAL
   */
  ag.openPDF = function (path, name) {
    var log = log || false,
        fileName;
    if (isiPlanner) {
      calliPlanner('openPDF', path);
    }
    // If name is included, automatically log opening of document
    if (name) {
      fileName = path.replace(/^.*[\\\/]/, '');
      ag.submit.document(fileName, name);
    }
  }

  /**
   * Sends email from iPlanner
   * NOTE: Can currently only send one file, and the file has to be in root
   * @public     
   * @param address string   
   * @param subject string   
   * @param body string   
   * @param fileName string   
   */
  ag.sendMail = function (address, subject, body, fileName) {
    var args, invokeString, iFrame;
    if (isiPlanner) {
      args = JSON.stringify({'address': address, 'subject': subject, 'body':body, 'fileName': fileName});
      calliPlanner('sendMail', args);
    }
  }

  /***********************************************************
  *
  * Get data from Agnitio (iPlanner, DBs etc)
  *
  ***********************************************************/

  /**
   * @namespace     ag.data
   * @description   API for getting data from Agnitio into presentation
   */
  ag.data = (function() {
    // Holder for contacts returned from calling 'ag.data.getCallContacts'
    var call_contacts = null;
    
    /**
     * Save returned contacts to property
     * Is used as callback in 'ag.data.getCallContacts'
     * @private
     * @param data Data object
     */
    function saveContacts (data) {
      var contacts = JSON.parse(data);
      ag.data.call_contacts = contacts;
    }

    /**
     * Get contacts that have been set up in the pre-call data
     * Will store the contacts as JavaScript objects to 'ag.data.call_contacts'
     * @public
     */
    function getCallContacts () {
      if (isiPlanner) {
        calliPlanner('getCallContacts', 'ag.data._saveContacts');
      }
    }

    // Public API
    return {
      call_contacts: call_contacts,
      getCallContacts: getCallContacts,
      _saveContacts: saveContacts
    }

  }());

  /***********************************************************
  *
  * Save data to the Agnitio Analyzer DB (direct or via iPlanner)
  *
  ***********************************************************/

  /**
   * @namespace     ag.submit
   * @description   Functionality for saving data to the Agnito Analyzer
   */
  ag.submit = (function() {

    var currentSlideId = null,
        currentData = null,
        enabled = true;
    
    function isEnabled () {
      return enabled;
    }

    function disable () {
      enabled = false;
    }

    function enable () {
      enabled = true;
    }

    // Default save method, used internally by API
    function save (data) {
     var formattedData, beacon, url;
     if (isEnabled) {
       formattedData = JSON.stringify(data);
       // console.log("Saving " + data.valueId + " data...");
     }
    }

    // Save function if viewed in iPlanner
    function saveForiPlanner (data) {
      var formattedData;
      if (isEnabled) {
       formattedData = JSON.stringify(data);
       calliPlanner('monitoringEvent', formattedData);
      }
    }

    /**
     * Get current time in seconds
     * @private
     */
    function timestamp () {
      return Math.floor((new Date().getTime()) / 1000);
    }

    /**
     * Save slide data
     * @public
     * @param data Data object
     */
    function slide (data) {

     var monitoringData,
         now            = timestamp(),
         chapterName    = data.chapter || null,
         chapterId      = data.chapterId || null,
         subChapterName = data.subChapter || null,
         subChapterId   = data.subChapterId || null,
         slideIndex     = data.slideIndex || null,
         slidePath      = data.path || null,
         parent         = data.parent || null,
         grandParent    = data.grandParent || null;

     // Chapter validation and setting of parents
     // Parents are set for backward compatibility
     if (chapterName) {
      if (subChapterName) {
        grandParent = grandParent || chapterName;
        parent = parent || subChapterName;
      }
      else {
        parent = parent || chapterName;
      }
     }
     else if (subChapterName) {
      // Register error. Can't have subchapter without chapter
     }

     // Exit previous slide if there is one
     if (currentSlideId) { slideExit(); }

     // The data to be sent to database
     monitoringData = {
       type: "system",
       categoryId: null,
       category: "slideEnter",
       labelId: "id",
       label: "name",
       valueId: data.id,
       value: data.name,
       valueType: null,
       time: now,
       slideIndex: slideIndex,
       slidePath: slidePath,
       chapterName: chapterName,
       chapterId: chapterId,
       subChapterName: subChapterName,
       subChapterId: subChapterId,
       parentSlideName: parent,
       parentOfParentSlideName: grandParent
     };
     
     // Set the entered slide as the current one
     currentSlideId = data.id;
     currentData = data;
     
     save(monitoringData);
    }

    /**
     * Exit previous slide
     * @private
     */
    function slideExit () {
     
      var data, now;
       
      if (!currentSlideId) { return; }
       
      now = timestamp();
       
      data = {
        type: "system",
        categoryId: null,
        category: "slideExit",
        labelId: "id",
        label: "name",
        valueId: currentSlideId,
        value: undefined,
        valueType: undefined,
        time: now,
        slidePath: undefined,
        chapterName:undefined,
        chapterId: undefined,
        subChapterName: undefined,
        subChapterId: undefined
      };
       
      // Remove current slide
      currentSlideId = null;
      // currentData = null;
       
      save(data);
    }

    /**
     * Resume monitoring after pausing
     * @public
     */
    function resume () {
      ag.submit.slide(currentData);
    }
    
    /**
     * Save opened document
     * @public
     * @param id Id of the opened document
     * @param name Name of the opened document
     */ 
    function documentOpen (id, name) {
     
      var data, now;
       
      now = timestamp();

      // The data to be sent to database
      data = {
        type: "system",
        categoryId: null,
        category: "documentOpen",
        labelId: "id",
        label: "name",
        valueId: id,
        value: name,
        valueType: null,
        time: now
      };
      
      // Set the opened document as the current one
      currentDocument = id;
       
      save(data);
    }
    
    /**
     * Close opened document
     * @public
     */ 
    function documentClose () {
     
      var data, now;
      
      if (!currentDocument) { return; }
       
      now = timestamp();

      // The data to be sent to database
      data = {
        type: "system",
        categoryId: null,
        category: "documentClose",
        labelId: "id",
        label: "name",
        valueId: currentDocument,
        value: undefined,
        valueType: undefined,
        time: now
      };
      
      // Set the entered slide as the current one
      currentDocument = null;
       
      save(data);
    }

    /**
     * Save opened reference
     * @public
     * @param id Id of the opened reference
     * @param name Name of the opened reference
     */ 
    function referenceOpen (id, name) {
     
      var data, now;
       
      now = timestamp();
       
      // The data to be sent to database
      data = {
        type: "system",
        categoryId: null,
        category: "referenceOpen",
        labelId: "id",
        label: "name",
        valueId: id,
        value: name,
        valueType: null,
        time: now
      };
      
      // Set the opened document as the current one
      currentDocument = id;
       
      save(data);
    }

    /**
     * Save opened media
     * @public
     * @param id Id of the opened media
     * @param name Name of the opened media
     */ 
    function mediaOpen (id, name) {
     
      var data, now;
       
      now = timestamp();
       
      // The data to be sent to database
      data = {
        type: "system",
        categoryId: null,
        category: "mediaOpen",
        labelId: "id",
        label: "name",
        valueId: id,
        value: name,
        valueType: null,
        time: now
      };
       
      save(data);
    }

    /**
     * Save a presentation structure
     * @public
     * @param name string Label to identify structure
     * @param data Data object to save
     */ 
    function structure (name, structure) {

      var monitorData,
          now = timestamp();

      monitorData = {
        isUnique: true,
        type: "custom",
        category: "Presentation structure",
        categoryId: "ag-002",
        label: name,
        labelId: "",
        value: structure,
        valueId: "",
        valueType: "text",
        time: now
      }

      save(monitorData);
    }

    /**
     * Save a custom event
     * @public
     * @param data Data object to save
     */ 
    function customEvent (data) {

      var monitorData,
          now = timestamp(),
          category = data.category || 'Uncategorized',
          categoryId = data.categoryId || null,
          labelId = data.labelId || null,
          valueId = data.valueId || null,
          valueType = data.valueType || 'text',
          path = data.path || null;
          isUnique = data.unique || false;

      monitorData = {
        isUnique: isUnique,
        type: "custom",
        category: category,
        categoryId: categoryId,
        label: data.label,
        labelId: labelId,
        value: data.value,
        valueId: valueId,
        valueType: valueType,
        slidePath: path,
        time: now
      }

      save(monitorData);
    }

    // Set save method depending on environment
    if (isiPlanner) {
      save = saveForiPlanner;
    }
    else {
      //TODO: Create the necessary objects that are normally created by iPlanner
    }

    // Public API
    return {
      isEnabled: isEnabled,
      disable: disable,
      enable: enable,
      slide: slide,
      resume: resume,
      document: documentOpen,
      reference: referenceOpen,
      media: mediaOpen,
      structure: structure,
      data: customEvent,
      event: customEvent,
      _slideExit: slideExit
    }

  }()); // End ag.submit

  /***********************************************************
  *
  * Make sure JSON is available, else make it so
  *
  ***********************************************************/
  
  // Make sure JSON methods are available
  // TODO: TEST!
  if (!isiPad && !window.JSON) {
    var script  = document.createElement('script');
    script.src  = file;
    script.type = 'text/javascript';
    script.defer = true;
    document.getElementsByTagName('head').item(0).appendChild('lib/json2.js');
    // throw new Error('JSON methods are not available, please add json2.js');
  }

  /***********************************************************
  *
  * Save the version of this API to the Analyzer
  *
  ***********************************************************/

  // Send the API version being used to the Analyzer
  ag.submit.data({
    unique: true,
    categoryId: "ag-001",
    category: "Versions",
    labelId: "ag-001-001",
    label: "Agnitio API version",
    value: api_version
  });

  /***********************************************************
  *
  * Make sure this API is compatible with older presentations
  * At some point these will be removed
  *
  ***********************************************************/

  // Utility functions
  if (!window.openPDF) {
    window.openPDF = ag.openPDF;
  }
  if (!window.sendMail) {
    window.sendMail = ag.sendMail;
  }
  if (!window.closePresentation) {
    window.closePresentation = function() {
      //ag.closePresentation;
    };
  }

  // Monitoring events
  if (!window.submitSlideEnter) {
    window.isMonitoringEnabled = ag.submit.isEnabled;
    window.monitorSayHello = function() {};
    window.submitSlideEnter = function(slideId, slideName, slideIndex, parent, grandparent) {
      var gp = grandparent || null,
          p = parent || null,
          i = slideIndex || null;
      ag.submit.slide({
        grandParent: gp,
        parent: p,
        slideIndex: i,
        id: slideId,
        name: slideName
      });
    };
    window.submitSlideExit = function() {
      ag.submit._slideExit();
    }
    window.submitSlideReEnter = function() {
      ag.submit.resume();
    }
    window.submitDocumentOpen = function(id, name) {
      ag.submit.document(id, name);
    }
    window.submitReferenceOpen = function(id, name) {
      ag.submit.reference(id, name);
    }
    window.submitCustomEvent = function(category, label, value, valueType) {
      var vt = valueType || 'text';
      ag.submit.event({
        category: category,
        label: label,
        value: value,
        valueType: vt
      });
    }
    window.submitUniqueCustomEvent = function(category, label, value, valueType) {
      var vt = valueType || 'text';
      ag.submit.event({
        unique: true,
        category: category,
        label: label,
        value: value,
        valueType: vt
      });
    }
  }

}());