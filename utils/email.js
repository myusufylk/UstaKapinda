// Dummy email functions
const sendVerificationEmail = async (email, token) => {
    console.log('E-posta gönderme devre dışı:', { email, token });
    return Promise.resolve();
};

const sendPasswordResetEmail = async (email, token) => {
    console.log('Şifre sıfırlama e-postası devre dışı:', { email, token });
    return Promise.resolve();
};

module.exports = {
    sendVerificationEmail,
    sendPasswordResetEmail
}; 