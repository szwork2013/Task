//Hivepod Metamodel
var meta = require('./meta');

var metamodel = new meta.Metamodel({
	classes : [
		new meta.Class({
			name: 'User',
			attributes: [
				new meta.Attribute({ name: 'Name', type: 'string', required: true }),
				new meta.Attribute({ name: 'Lastname', type: 'string', required: true }),
				new meta.Attribute({ name: 'Age', type: 'int' }),
				new meta.Attribute({ name: 'IsActive', type: 'bool', required: true })	
			]
		}),
		new meta.Class({
			name: 'Place',
			attributes: [
				new meta.Attribute({ name: 'Name', type: 'string', required: true }),
				new meta.Attribute({ name: 'Description', type: 'string' }),
				new meta.Attribute({ name: 'Location', type: 'geopoint' }),
				new meta.Attribute({ name: 'Picture', type: 'image' })	
			]
		})	
	],
	associations : [
	
	]
});
		
module.exports = metamodel;
