const jwt = require("jsonwebtoken");
const secret = process.env.JWT_SECRET;
const duration = process.env.JWT_TIMEOUT_DURATION;

exports.authenticate = async (req, res, next) => {
	var header = req.headers.authorization || '';
	var token = header.split(/\s+/).pop() || '';

	if (token) {
		jwt.verify(token, secret, (error, tokenDetails) => {
			if (error) {
				res.json({ status: 0, logout: true })
			} else {
				const jwtPayload = {
					_id: tokenDetails._id,
					firstName: tokenDetails.firstName,
					lastName: tokenDetails.lastName,
					email: tokenDetails.email,
					role: tokenDetails.role,
					color: tokenDetails.color,
				};
				const jwtData = {
					expiresIn: duration,
				};
				const newToken = jwt.sign(jwtPayload, secret, jwtData);

				((proxied) => {
					res.json = function (data) {
						data.newToken = newToken;
						return proxied.call(this, data);
					};
				})(res.json);
				next();
			}
		});
	} else {
		res.json({ status: 0, logout: true })
	}
}