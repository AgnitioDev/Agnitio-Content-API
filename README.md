# Agnitio Content API

The Agnitio Content API is a collection of JavaScript methods that allow a developer to communicate with the Agnitio platform from the content.

Please see following Wiki page for documentation: http://wiki.agnitio.com/index.php/Agnitio_Content_API_(iPad)

# Change log

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