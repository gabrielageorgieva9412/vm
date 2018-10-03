
module.exports.validate = (data) => {
	let errors = '';

	if(data.lastName === '' || data.firstName === '' || data.password === '' || data.email === '' || data.passwordRepeat === '') {
		errors += 'Please fill all fields';
	}

	// eslint-disable-next-line
	var passwordRegEx = new RegExp('^(?:[0-9]+[a-z]|[a-z]+[0-9])[a-z0-9]*$');
	if(!passwordRegEx.test(data.password)) {

		errors += 'Password must contain at least one letter and one number!';
	}

	return errors;
};
