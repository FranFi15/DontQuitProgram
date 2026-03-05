import nodemailer from 'nodemailer';

// Configuración REFORZADA para GMAIL (Optimizado para Render)
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // 👈 Para el puerto 587 esto DEBE ser false
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    // Esto es vital para que Google no rechace la conexión de Render
    ciphers: 'SSLv3',
    rejectUnauthorized: false
  },
  connectionTimeout: 20000, // Le damos 20 segundos
});

export const sendWelcomeEmail = async (userEmail, userName, paymentMethod) => {
  try {
    let paymentText = '';
    if (paymentMethod === 'TRANSFER') {
      paymentText = 'Recibimos tu comprobante de transferencia. Rocío está verificando el pago y en breve activará tu cuenta.';
    } else {
      paymentText = 'Tu cuenta fue creada. Una vez que completes el pago, tu plan se activará automáticamente.';
    }

    const mailOptions = {
      from: `"Don't Quit. Program" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: '¡Bienvenido/a a Don\'t Quit! 🚀',
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #000;">¡Hola ${userName.split(' ')[0]}! Bienvenido/a al equipo.</h2>
          <p>Tu cuenta fue pre-creada con éxito en nuestra plataforma.</p>
          
          <div style="background-color: #f4f4f4; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Tu usuario para ingresar es:</strong> ${userEmail}</p>
            <p style="margin: 0; font-size: 0.9em; color: #666;">(La contraseña es la que elegiste en el formulario)</p>
          </div>

          <p>${paymentText}</p>
          
          <a href="https://dont-quit-program.vercel.app/login" style="display: inline-block; background-color: #000; color: #FAF3EF; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 20px;">
            Ir a Iniciar Sesión
          </a>
        </div>
      `
    };

    // Quitamos el await aquí para que el backend no se quede "colgado" esperando al mail
    transporter.sendMail(mailOptions)
      .then(() => console.log(`✉️ Mail de bienvenida enviado a ${userEmail}`))
      .catch(err => console.error("❌ Error interno Nodemailer:", err));

  } catch (error) {
    console.error("❌ Error en la función sendWelcomeEmail:", error);
  }
};