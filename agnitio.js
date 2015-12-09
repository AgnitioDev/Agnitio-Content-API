/**
 * agnitio.js
 *
 * The Agnitio Content API
 *
 * Documentation can be found at:
 * http://wiki.agnitio.com/index.php/Agnitio_Content_API_(iPad)
 *
 * @author     Stefan Liden
 * @copyright  Copyright 2015 Agnitio
 */

/**
 * Used as callback when getting Agnitio platform info from device
 * Has to be directly on window object
 * @public        
 */
window.setAgnitioPlatform = function(data) {
  var info = JSON.parse(data);
  window.agnitioInfo = info;
  window.ag.setAgnitioInterface(info);
};

(function () {

  // Create the global Agnitio namespace 'ag'
  var ag = window.ag || {};

  var api_version = '1.6.2',
      customInvoke = false,
      appInterface = null,
      ua = navigator.userAgent,
      // From: http://davidwalsh.name/detect-ipad
      isiPad = /iPad/i.test(ua) || /iPhone OS 3_1_2/i.test(ua) || /iPhone OS 3_2_2/i.test(ua),
      isSafari = ua.match(/Safari/i) !== null,
      // UIWebView does not contain the word "Version" in user agent string
      isUIWebView = /(iPhone|iPod|iPad).*AppleWebKit(?!.*Version)/i.test(navigator.userAgent),
      // isAndroid = ua.indexOf("Android") > -1,
      isiPlanner = isUIWebView; // Default, TODO: check platform.isAgnitio

  // At this point entire API is available
  ag.init = function() {
    window.ag = ag; // Make it available everywhere
    // Send the API version being used to the Analyzer
    ag.submit.data({
      unique: true,
      categoryId: "ag-001",
      category: "Versions",
      labelId: "ag-001-001",
      label: "Agnitio API version",
      value: api_version
    });
  }

  /**
   * Set custom invoke interface
   * @public       
   */
  ag.setInvoke = function (to) {
    customInvoke = true;
    appInterface = to;
  }

  /**
   * Get version of Agnitio Content API (this file) 
   * @public        
   */
  ag.getVersion = function () {
    return api_version;
  }

  /**
   * Get version of Agnitio Content API (this file) 
   * @public
   * @param info object OPTIONAL      
   */
  ag.setAgnitioInterface = function(info) {
    info = info || window.agnitioInfo || window.iPlanner;
    if (!info) {
      // Uncomment this for Engager C# version
      // connect("http://engager.agnitio.com", "agnitioInfo");
    }
    else if (info.applicationName === "Engager C#") {
      appInterface = "http://engager.agnitio.com";
    }
    else if (info.localizedModel === "iPad") {
      appInterface = "objc://iplanner";
    }
    // Otherwise it will have to be set manually using ag.setInvoke
    // Alternatively Pub/Sub feature can be used
  };

  /**
   * Invoke method on platform/device
   * @private       
   */
  function invoke (api, params) {
    // Default will be no action
    if (appInterface) connect(appInterface, api, encodeURIComponent(params));
  } 

  // Invoke public method of Agnitio device/server
  function connect (to, api, params) {
    var invokeString, iFrame;
    invokeString = to + "/" + api + "?" + params;
    iFrame = document.createElement("IFRAME");
    iFrame.setAttribute("src", invokeString);
    document.body.appendChild(iFrame); 
    iFrame.parentNode.removeChild(iFrame);
    iFrame = null;
  }

  // Set save method depending on environment
  ag.setAgnitioInterface();

  /***********************************************************
  *
  * Pub/Sub
  *
  ***********************************************************/

  var listeners = {};
  var tokens = {}; // Will allow unregistering listener

  /**
  * Publish event asynchronously
  * @private       
  */
  function publish (api, data) {
    setTimeout(function() {
      ag.publish(api, data);
    },0); 
  }

  // Listen to an event
  ag.on = function (event, callback) {
    var token;
    if (!listeners.hasOwnProperty(event)) {
      listeners[event] = [];
    }
    // ln = listeners[event].length;
    token = event + "_" + new Date().getTime();
    listeners[event].push(token);
    tokens[token] = [event, callback];
    return token;
  }

  ag.off = function (token) {
    var pos, listener;
    var evt = tokens[token];
    if (evt) {
      listener = listeners[evt[0]];
      pos = listener.indexOf(token);
      listener.splice(pos, 1);
    }
  }

  ag.publish = function (event, args) {
    if (listeners.hasOwnProperty(event)) {
      for (var i = 0; i < listeners[event].length; ++i) {
        try {
          tokens[listeners[event][i]][1].call(null, args);
          // listeners[event][i].call(null, args);
        } catch (e) {
          if (console && console.error) {
            console.error(e);
          }
        }
      }
    }
  }

  /***********************************************************
  *
  * Agnitio Debugger
  *
  ***********************************************************/

  // To access API it should be called as
  // var debugger = ag.debug();

  ag.debug = function(writeToConsole) {
    writeToConsole = typeof writeToConsole !== 'undefined' ? writeToConsole : false;
    var active = false;
    var data = []; // Container for all monitoring data
    // Event listener tokens
    var meToken, pdfToken, urlToken, mailToken, captureToken, presenterToken, contactsToken, attributesToken;

    if (window.console && window.console.warn) {
      console.warn('This presentation is in debug mode and will not submit to Agnitio Analytics.\nRemove ag.debug() call before publishing.');
    }

    // Write to console
    function write (api, info) {
      if (writeToConsole) console.log('[DEBUG] ' + api, info);
    }

    function validate (event) {
      if (event.category && event.label && event.value || event.category === 'slideExit') {
        return true;
      }
      return false;
    }

    // Log a monitoring event
    function log (event) {
      if (validate(event)) {
        // If the unique flag is set to true, we need to replace any previous ones
        // Only worry about this if specifically in debug mode
        if (event.isUnique) {
          data.forEach(function(loggedEvent, i) {
            if ((loggedEvent.category === event.category) && (loggedEvent.label === event.label)) {
              data.splice(i, 1);
            }
          });
        }
        data.push(event);   
        write(event.category, event);
      }
      // TODO: log error
    }


    // Set up listeners
    function start () {
      active = true;
      meToken = ag.on('monitoringEvent', log);
      pdfToken = ag.on('openPDF', function(path) {write('openPDF', path)} );
      urlToken = ag.on('openURL', function(url) {write('openURL', url)} );
      mailToken = ag.on('sendMail', function(params) {write('sendMail', params)} );
      captureToken = ag.on('captureImage', function(params) {write('captureImage', params)} );
      presenterToken = ag.on('getPresenter', function(params) {write('getPresenter', params)} );
      contactsToken = ag.on('getCallContacts', function(params) {write('getCallContacts', params)} );
      attributesToken = ag.on('getCallAttributes', function(params) {write('getCallAttributes', params)} );
    }

    // Stop debugging
    function stop () {
      active = false;
      ag.off(meToken); 
      ag.off(pdfToken); 
      ag.off(urlToken); 
      ag.off(mailToken);
      ag.off(captureToken);
      ag.off(presenterToken);
      ag.off(contactsToken);
      ag.off(attributesToken);
    }

    // Get the log data
    function getLog () {
      return data;
    }

    start();

    // Public API
    return {
      start: start,
      stop: stop,
      getLog: getLog
    }
  };

  // Backward compatibility
  ag.debug.init = function(log) {
    ag.debug(log);
  }

  /***********************************************************
  *
  * Get information about the platform
  *
  ***********************************************************/

  ag.platform = (function() {

    function info () {
      if (window.agnitioInfo) {
          return window.agnitioInfo;
      }
      else if (window.iPlanner) {
          return window.iPlanner;
      }
      return undefined;
    }

    // Utility for quickly checking if currently running in Agnitio
    function isAgnitio () {
      if (window.agnitioInfo || window.iPlanner) {
          return true;
      }
      return false;
    }

    // Utility for checking if currently running in an App (vs. web)
    // Currently check for iOS only
    function isApp () {
      if (isUIWebView) return true;
      return false;
    }

    return {
      info: info,
      isAgnitio: isAgnitio,
      isApp: isApp
    }
  }());


  /***********************************************************
  *
  * Call built-in Agnitio functionality
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
    args = JSON.stringify(params);
    invoke('sigCapture', args);
    publish('captureImage', params);
  }

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
    invoke('openPDF', path);
    publish('openPDF', path);
    // If name is included, automatically log opening of document
    if (name) {
      fileName = path.replace(/^.*[\\\/]/, '');
      ag.submit.document(fileName, name);
    }
  }


  /**
   * Opens URL in a viewer
   * @public     
   * @param path string   
   * @param name string OPTIONAL
   */
  ag.openURL = function (url) {
    var log = log || false,
        fileName;
    // invoke('openPDF', path); // Not yet supported in devices
    publish('openURL', url);
  }

  /**
   * Sends email from iPlanner
   * NOTE: If using string for file attachment it will expect a filename, not path
   * @public     
   * @param address string   
   * @param subject string   
   * @param body string   
   * @param files array/string  
   */
  ag.sendMail = function (address, subject, body, files) {
    files = files || '';
    var params, args;
    if (typeof files === 'string' || files instanceof String) {
      params = {'address': address, 'subject': subject, 'body':body, 'fileName': files}
    }
    else {
      params = {'address': address, 'subject': subject, 'body':body, 'fileNames': files}
    }
    args = JSON.stringify(params);
    invoke('sendMail', args);
    publish('sendMail', params);
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
    var presenter = null,
        call_attributes = [],
        call_contacts = [];

    /**
     * Save returned presenter attributes to property
     * Is used as callback in 'ag.data.getPresenter'
     * @private
     * @param data Data object
     */
    function savePresenter (data) {
      var attributes = JSON.parse(data);
      ag.data.presenter = attributes;
    }

    /**
     * Save returned meeting attributes to property
     * Is used as callback in 'ag.data.getMeetingAttributes'
     * @private
     * @param data Data object
     */
    function saveCallAttributes (data) {
      var attributes = JSON.parse(data);
      ag.data.call_attributes = attributes;
    }

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
     * Get presenter attributes (e.g. sales rep attributes)
     * Implemented in iPlanner 1.11
     * @public
     */
    function getPresenter () {
      invoke('getPresenter', '{"resultFunction": "ag.data._savePresenter"}');
      publish('getPresenter', null);
    }

    /**
     * Get meeting attributes (dynamic custom attributes)
     * If no parameter is given it will return all known attributes for the meeting
     * Implemented in iPlanner 1.11
     * @public
     * @param attributes Array of names of desired attribute - OPTIONAL
     */
    function getCallAttributes (attributes) {
      var attr = attributes || [],
          attrStr = JSON.stringify(attr);
      invoke('getMeetingDynamicAttributes', '{"wantedAttributes": ' + attrStr + ', "resultFunction": "ag.data._saveCallAttributes"}');
      publish('getCallAttributes', attr);
    }

    /**
     * WORK IN PROGRESS
     * Set meeting attributes (dynamic custom attributes)
     * If no parameter is given it will return all known attributes for the meeting
     * Implemented in iPlanner 1.11
     * @public
     * @param attributes Array of names of desired attribute - OPTIONAL
     */
    function setCallAttributes (attributes) {
      var attr = attributes || [];
    // invoke('getMeetingDynamicAttributes', '{"wantedAttributes": attr, "resultFunction": "ag.data._saveCallAttributes"}');
    }

    /**
     * Get contacts that have been set up in the pre-call data
     * Will store the contacts as JavaScript objects to 'ag.data.call_contacts'
     * This function is best called when the presentation is initialized
     * Implemented in iPlanner 1.9.1
     * @public
     */
    function getCallContacts () {
      invoke('getCallContacts', 'ag.data._saveContacts');
      publish('getCallContacts', null);
    }

    // Public API
    return {
      presenter: presenter,
      call_contacts: call_contacts,
      call_attributes: call_attributes,
      getPresenter: getPresenter,
      getCallAttributes: getCallAttributes,
      getCallContacts: getCallContacts,
      _savePresenter: savePresenter,
      _saveCallAttributes: saveCallAttributes,
      _saveContacts: saveContacts
    }

  }());

  /***********************************************************
  *
  * Communication between content and external host (e.g. in iFrames)
  *
  ***********************************************************/

  /**
   * @namespace     ag.msg
   */
  ag.msg = (function() {

    var host;
    var queue = [];
    var msgListener; 

    // Pass on monitoring events to host
    msgListener = ag.on("monitoringEvent", function(event) {
        send({
          name: "monitoringEvent",
          value: JSON.stringify(event)
        });
      });

    function connect(source) {
      host = source;
      if (queue.length) processQueue(); // Events before connection
    }

    function processQueue() {
      var item;
      if (host) {
        while (queue.length > 0) {
          item = queue.shift();
          host.postMessage(item, "*");
        }
      }
    }

    // Called by content
    // data: {name: 'event', value: 'data'}
    function send(data) {
      queue.push(data);
      processQueue();
    }

    return {
      connect: connect,
      send: send
    }

  }());

  /***********************************************************
  *
  * Provide content to users
  *
  ***********************************************************/

  /**
   * @namespace     ag.content
   * @description   Functionality for Agnitio Microsites
   */
  ag.content = (function() {

    var contentData = {};

    // Setup communication between Microsite and Content
    // This is called from Microsite server
    // @param source - The Microsite host
    function setup(source, data) {
      contentData.topics = data.topics || [];
      contentData.inactiveTopics = data.inactiveTopics || [];
      contentData.email = data.email || '';
      contentData.name = data.user || '';

      ag.msg.connect(source);

      // Send event so that frameworks/presentations can act on it
      publish('contentData', contentData);

      // Allow styles specific for Microsites
      document.documentElement.classList.add('ag-microsite');
    }

    /**
     * Save returned settings
     * Is used as callback in 'ag.content.getSettings'
     * @private
     * @param data Data object
     */
    function saveSettings (data) {
      var attributes = JSON.parse(data);
      ag.content.settings = attributes;
    }

    function get() {
      return contentData;
    }

    function getSettings() {
      invoke('getContentSettings', '{"resultFunction": "ag.content._saveSettings"}');
      publish('getSettings', null);
    }

    // Will contact Mobilizer with data for single user
    function provide(users, content) {
      var userList = JSON.stringify(users);
      var ids = JSON.stringify(content);
      invoke('provideContent', '{"users": ' + userList + ', "content": ' + ids + '}');
      publish('provideContent', {users: users, content: content});
    }

    function send(type, users, content, template) {
      var userList = JSON.stringify(users);
      var ids = JSON.stringify(content);
      invoke('sendContent', '{"users": ' + userList + ', "content": ' + ids + ', "type": "' + type + '", "template": "' + template + '"}');
      publish('sendContent', {users: users, content: content, type: type, template: template});
    }

    // Provision content but send to presenter instead of directly to contacts. Otherwise works as ag.content.send
    function proxy(type, users, content, template) {
      var userList = JSON.stringify(users);
      var ids = JSON.stringify(content);
      invoke('proxyContent', '{"users": ' + userList + ', "content": ' + ids + ', "type": "' + type + '", "template": "' + template + '"}');
      publish('proxyContent', {users: users, content: content, type: type, template: template});
    }

    return {
      setup: setup,
      provide: provide,
      send: send,
      proxy: proxy,
      get: get,
      getSettings: getSettings,
      _saveSettings: saveSettings
    }

  }());

  /***********************************************************
  *
  * Allow content to be remote controlled
  *
  ***********************************************************/

  /**
   * @namespace     ag.remote
   * @description   Functionality for remote control of presentations
   */
  ag.remote = (function() {

    var userrole;

    // Called by the hosting app once it has loaded the content in iFrame
    // e.g. Agnitio Remote calls it once the user has loaded the presentation
    function register(source, data) {

      ag.msg.connect(source);

      userrole = data.role;
      
      // Send event so that frameworks/presentations can act on it
      publish('registerUser', data);
      
      // Allow styles specific for remote
      document.documentElement.classList.add('ag-remote');
      if (data.role === "presenter") {
        document.documentElement.classList.add('ag-role-presenter');
      }
      else {
        document.documentElement.classList.add('ag-role-contact');
      }
    }

    function getUserRole() {
      return userrole;
    }

    return {
      register: register,
      getUserRole: getUserRole
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

    // Save function if viewed in iPlanner
    function save (data) {
      if (isEnabled()) {
        invoke('monitoringEvent', JSON.stringify(data));
        publish('monitoringEvent', data);
      }
    }

    /**
     * Get current time in seconds
     * @private
     */
    function timestamp() {
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

     ag.submit.save(monitoringData);
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
        slideIndex: undefined,
        slidePath: undefined,
        chapterName:undefined,
        chapterId: undefined,
        subChapterName: undefined,
        subChapterId: undefined
      };

      // Remove current slide
      currentSlideId = null;

      ag.submit.save(data);
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
      // currentDocument = id;

      ag.submit.save(data);
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
      // currentDocument = id;

      ag.submit.save(data);
    }

    /**
     * Save a presentation structure
     * @public
     * @param name string Label to identify structure
     * @param data Data object to save
     * DEPRECATED
     */ 
    function dep_structure () {}

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
          path = data.path || null,
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

      ag.submit.save(monitorData);
    }

    // Public API
    return {
      save: save, // override save method
      isEnabled: isEnabled,
      disable: disable,
      enable: enable,
      slide: slide,
      resume: resume,
      'document': documentOpen,
      reference: referenceOpen,
      structure: dep_structure,
      data: customEvent,
      'event': customEvent,
      _slideExit: slideExit
    }

  }()); // End ag.submit

  /***********************************************************
  *
  * Listen to messages from the outside
  *
  ***********************************************************/

  function receiveMessage(event) {

      // TODO: add check that the origin is an Agnitio server

      if (event.data) {
        if (typeof event.data === 'string') event.data = JSON.parse(event.data);
        switch (event.data.name) {
          case "navigate":
            publish('goTo', event.data.path);
            break;
          case "enterState":
            publish('enterState', event.data.stateData);
            break;
          case "exitState":
            publish('resetState', event.data.stateData);
            break;
          case "register":
            ag.remote.register(event.source, event.data);
            break;
          case "provide":
            ag.content.setup(event.source, event.data);
            break;
          case "connect":
            ag.msg.connect(event.source);
            break;
        }
      }
    }

    // Listen for messages from outside
    window.addEventListener("message", receiveMessage, false);

  // We are ready now...
  ag.init();

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
    window.isMonitoringEnabled = ag.submit.isEnabled();
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