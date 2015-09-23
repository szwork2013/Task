//Create test data for backend services
var mongoose = require('mongoose');

var models = require('./model');

var dbName = process.env.MONGOLAB_URI || 'mongodb://localhost:27017/DemoDb';
mongoose.connect(dbName);


// Clear the database of old data
mongoose.model('user').remove(function (error) {
  if (error) {
  	throw error;
  }
});
mongoose.model('place').remove(function (error) {
  if (error) {
  	throw error;
  }
});

console.log('Data deleted on: ' + dbName);

// Put the fresh data in the database
//Data for User ---------------------------
console.log('  Creating data for  User.');

mongoose.model('user').create( {
		name: 'Name0',
		lastname: 'Lastname1',
		age: 20,
		isActive: false
	}, function (error) { 
		if (error) {
			throw error;
		} 
	}
);
mongoose.model('user').create( {
		name: 'Name4',
		lastname: 'Lastname5',
		age: 60,
		isActive: false
	}, function (error) { 
		if (error) {
			throw error;
		} 
	}
);
mongoose.model('user').create( {
		name: 'Name8',
		lastname: 'Lastname9',
		age: 100,
		isActive: false
	}, function (error) { 
		if (error) {
			throw error;
		} 
	}
);
mongoose.model('user').create( {
		name: 'Name12',
		lastname: 'Lastname13',
		age: 140,
		isActive: false
	}, function (error) { 
		if (error) {
			throw error;
		} 
	}
);
mongoose.model('user').create( {
		name: 'Name16',
		lastname: 'Lastname17',
		age: 180,
		isActive: false
	}, function (error) { 
		if (error) {
			throw error;
		} 
	}
);
//Data for Place ---------------------------
console.log('  Creating data for  Place.');

mongoose.model('place').create( {
		name: 'Name20',
		description: 'Description21',
		location: {
			coordinates: [
				-5.9859841,
				-5.9859841
			],
			type: 'Point'
		},
		picture: ''
	}, function (error) { 
		if (error) {
			throw error;
		} 
	}
);
mongoose.model('place').create( {
		name: 'Name24',
		description: 'Description25',
		location: {
			coordinates: [
				-5.9859841,
				-5.9859841
			],
			type: 'Point'
		},
		picture: ''
	}, function (error) { 
		if (error) {
			throw error;
		} 
	}
);
mongoose.model('place').create( {
		name: 'Name28',
		description: 'Description29',
		location: {
			coordinates: [
				-5.9859841,
				-5.9859841
			],
			type: 'Point'
		},
		picture: ''
	}, function (error) { 
		if (error) {
			throw error;
		} 
	}
);
mongoose.model('place').create( {
		name: 'Name32',
		description: 'Description33',
		location: {
			coordinates: [
				-5.9859841,
				-5.9859841
			],
			type: 'Point'
		},
		picture: ''
	}, function (error) { 
		if (error) {
			throw error;
		} 
	}
);
mongoose.model('place').create( {
		name: 'Name36',
		description: 'Description37',
		location: {
			coordinates: [
				-5.9859841,
				-5.9859841
			],
			type: 'Point'
		},
		picture: ''
	}, function (error) { 
		if (error) {
			throw error;
		} 
	}
);

console.log('Fake Data created on: ' + dbName);
