# Agnitio Content API

The Agnitio Content API is a collection of JavaScript methods that allow a developer to communicate with the Agnitio platform from the content.

Please see following Wiki page for documentation: http://wiki.agnitio.com/index.php/Agnitio_Content_API_(iPad)

# Change log

## Version 1.5.2 2017-04-05

Fix for iPad Pro

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