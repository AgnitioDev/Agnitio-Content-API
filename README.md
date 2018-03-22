# Agnitio Content API

The API that can be used from any HTML content to communicate with the Agnitio platform (devices and servers).

These are the files that go in the `viewer/js` folder in devices and servers.

__Content:__

- agnitio.js (see [Wiki page](http://wiki.agnitio.com/index.php/Agnitio_Content_API_(iPad)) for documentation)
- agnitioExternal.js (see [the documentation](./external/README.md))

*Deprecated:*

- closepresentation.js
- monitor.js
- pdf.js
- sendmail.js

## Change log

### Version 1.6.4 2018-03-22

Extension in sending slideExit event

- Added sending slideExit event necessary data

### Version 1.6.3 2016-06-29

Extension of provisioning API

- Add subject to ag.content.proxy
- Add subject to ag.content.send

### Version 1.6.2 2015-12-07

Important bug fix. 1.6.1 (only bundled with Accelerator) didn't work properly in iPlanner.

- Fixed a device check as iOS Engager vs. iPlanner has diverged

### Version 1.6.1 2015-09-20

Extension of provisioning API

- Added ag.content.send

### Version 1.6.0 2015-09-03

Enabling remote controlled presentations, microsites, and making it play nice with Engager C#.

- Enabled possibility to use with Engager C#
- Added ag.msg
- Added ag.remote
- Added ag.content
- Added ag.openURL

## Version 1.5.1 2014-07-01

API added: ag.platform
Updated device check for changes in iOS 7.1

- Added ag.platform.info()
- Added ag.platform.isAgnitio()
- Added ag.platform.isApp()

## Version 1.5.0 2014-05-15

Exposed save and invoke API to allow customization.
Now possible to hook into the events using ag.on(event, callback) API
Improved debugging API

- Added ag.submit.save
- Added ag.setInvoke
- Added private invoke method
- Added ag.platform API
- Added Pub/Sub event system
- API will dispatch custom event by default
- Improved debugging feature

## Version 1.4.0 2014-04-25

Added debug logging functionality.

- Added ag.debug functionality
- Added ag.debug.listen
- Added ag.debug.getEvents
- Another fix to enabled monitoring check

## Version 1.3.0 2013-08-14

This release add API methods to get meeting and presenter attributes.

- Updated to version 1.3.0
- Added ag.data.getCallAttributes
- Added ag.data.call_attributes
- Added ag.data.getPresenterAttributes
- Added ag.data.presenter
- Added ag.getVersion
- Fixed check for enabled monitoring
- Removed minified version

## Version 1.2.0 2012-12-03

This release includes an update to the ag.sendMail method that will allow it to send multiple attachments.

- Updated to version 1.2.0
- Updated ag.sendMail to accept an array of file paths as last parameter
