const User = require('../models/user.model');
const { error } = require('../helpers/response');

const minFullNameLength = parseInt(process.env.FULLNAME_MIN_LENGTH) || 2;
const maxFullNameLength = parseInt(process.env.FULLNAME_MAX_LENGTH) || 50;
const minPasswordLength = parseInt(process.env.PASSWORD_MIN_LENGTH) || 6;
const maxPasswordLength = parseInt(process.env.PASSWORD_MAX_LENGTH) || 20;



async function validateLogin(req, res, next) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return error(res, 400, 'Vui lòng nhập đầy đủ email và mật khẩu.');
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
        if (!emailRegex.test(email)) {
            return error(res, 400, 'Email không hợp lệ.');
        }

        if (password.length < minPasswordLength || password.length > maxPasswordLength) {
            return error(
                res,
                400,
                `Mật khẩu phải từ ${minPasswordLength} đến ${maxPasswordLength} ký tự.`
            );
        }

        const user = await User.findOne({ email });
        if (!user) {
            return error(res, 404, 'Tài khoản không tồn tại.');
        }

        next();
    } catch (err) {
        console.error('Validate login error:', err);
        return error(res, 500, 'Lỗi validate đăng nhập', err.message);
    }
}


async function validateRegister(req, res, next) {
    try {
        const { fullName, email, password } = req.body;

        if (!fullName || !email || !password) {
            return error(res, 400, 'Vui lòng nhập đầy đủ thông tin.');
        }

        if (fullName.length < minFullNameLength || fullName.length > maxFullNameLength) {
            return error(
                res,
                400,
                `Họ và tên phải từ ${minFullNameLength} đến ${maxFullNameLength} ký tự.`
            );
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
        if (!emailRegex.test(email)) {
            return error(res, 400, 'Email không hợp lệ.');
        }

        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]+$/;

        if (password.length < minPasswordLength || password.length > maxPasswordLength) {
            return error(
                res,
                400,
                `Mật khẩu phải từ ${minPasswordLength} đến ${maxPasswordLength} ký tự.`
            );
        }


        if (!passwordRegex.test(password)) {
            return error(res, 400, 'Mật khẩu phải bao gồm cả chữ và số.');
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return error(res, 409, 'Email đã tồn tại.');
        }

        next();
    } catch (err) {
        console.error('Validate register error:', err);
        return error(res, 500, 'Lỗi validate đăng ký', err.message);
    }
}

module.exports = {
    validateLogin,
    validateRegister
};
