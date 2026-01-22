const User = require('../../../models/user.model');
const UserToken = require('../../../models/userToken.model');

class AuthController {
    async loginPage(req, res) {

        res.render('auth/login', {
            title: 'Đăng nhập',
        });
    }
    async registerPage(req, res) {

        res.render('auth/register', {
            title: 'Đăng ký',
        });
    }

    async verifyEmail(req, res) {
        try {
            const { token } = req.query;

            if (!token) {
                return res.render('auth/verify', {
                    success: false,
                    message: 'Liên kết xác nhận không hợp lệ. Vui lòng kiểm tra email của bạn.'
                });
            }

            const record = await UserToken.findOne({
                token,
                type: 'verify_email'
            });

            if (!record) {
                return res.render('auth/verify', {
                    success: false,
                    message: 'Liên kết xác nhận đã hết hạn hoặc không tồn tại. Vui lòng thử gửi lại email.'
                });
            }

            if (record.verified) {
                return res.render('auth/verify', {
                    success: true,
                    message: 'Tài khoản của bạn đã được kích hoạt. Bạn có thể đăng nhập ngay.'
                });
            }

            if (record.expiresAt < new Date()) {
                return res.render('auth/verify', {
                    success: false,
                    message: 'Liên kết xác nhận đã hết hạn. Vui lòng đăng ký lại để nhận link mới.',
                    email: record.email
                });
            }

            const user = await User.findById(record.userId);
            if (!user) {
                return res.render('auth/verify', {
                    success: false,
                    message: 'Tài khoản không tồn tại. Vui lòng đăng ký lại.'
                });
            }

            user.status = 1;
            await user.save();

            record.verified = true;
            await record.save();

            return res.render('auth/verify', {
                success: true,
                message: 'Xác nhận email thành công! Bạn có thể đăng nhập ngay.'
            });
        } catch (err) {
            console.error('Verify email error:', err);
            return res.render('auth/verify', {
                success: false,
                message: 'Lỗi máy chủ. Vui lòng thử lại sau.'
            });
        }
    }


    async loadResetPassword(req, res) {
        try {
            const { token } = req.query;

            if (!token) {
                return res.render('auth/reset-password', {
                    success: false,
                    message: 'Liên kết đặt lại mật khẩu không hợp lệ.'
                });
            }

            const record = await UserToken.findOne({
                token,
                type: 'reset_password'
            });

            if (!record) {
                return res.render('auth/reset-password', {
                    success: false,
                    message: 'Liên kết đặt lại mật khẩu không tồn tại hoặc đã hết hạn.'
                });
            }

            if (record.used) {
                return res.render('auth/reset-password', {
                    success: false,
                    message: 'Liên kết này đã được sử dụng.'
                });
            }

            if (record.expiresAt < new Date()) {
                return res.render('auth/reset-password', {
                    success: false,
                    message: 'Liên kết đặt lại mật khẩu đã hết hạn. Vui lòng yêu cầu lại.',
                    email: record.email
                });
            }

            const user = await User.findById(record.userId);
            if (!user) {
                return res.render('auth/reset-password', {
                    success: false,
                    message: 'Tài khoản không tồn tại.'
                });
            }
            
            return res.render('auth/reset-password', {
                success: true,
                token,
                email: user.email
            });

        } catch (err) {
            console.error('Load reset password error:', err);
            return res.render('auth/reset-password', {
                success: false,
                message: 'Lỗi máy chủ. Vui lòng thử lại sau.'
            });
        }
    }


}

module.exports = new AuthController();
