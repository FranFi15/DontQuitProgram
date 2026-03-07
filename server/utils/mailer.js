import { Resend } from 'resend';

// Inicializamos Resend. La API Key la sacaremos de las variables de entorno (.env)
const resend = new Resend(process.env.RESEND_API_KEY);

export const sendWelcomeEmail = async (userEmail, userName, paymentMethod) => {
  try {
    let paymentText = '';
    
    // Personalizamos el mensaje según el método de pago
    if (paymentMethod === 'TRANSFER') {
      paymentText = 'Recibimos tu comprobante de transferencia. Rocío está verificando el pago y en breve activará tu cuenta.';
    } else if (paymentMethod === 'GRATUITO') {
      paymentText = 'Tu plan de prueba gratuito ya está activo. ¡Podés ingresar ahora mismo a ver tus rutinas!';
    } else {
      paymentText = 'Tu cuenta fue creada. Una vez que se acredite el pago por la plataforma, tu plan se activará automáticamente.';
    }

    const { data, error } = await resend.emails.send({
      // ⚠️ IMPORTANTE: Mientras pruebas en Resend (sin dominio verificado), usa este correo.
      // Cuando verifiquen un dominio (ej: dontquit.com), lo cambian a "info@dontquit.com"
      from: "Don't Quit Program <onboarding@resend.dev>", 
      to: [userEmail],
      subject: '¡Bienvenido/a a Don\'t Quit! 🚀',
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden;">
          <div style="background-color: #000; padding: 25px; text-align: center;">
            <h1 style="color: #FAF3EF; margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 1px;">DON'T QUIT PROGRAM.</h1>
          </div>
          
          <div style="padding: 30px;">
            <h2 style="color: #111; margin-top: 0;">¡Hola ${userName.split(' ')[0]}! Bienvenido/a a Don't Quit Program.</h2>
            <p style="font-size: 16px; line-height: 1.6;">Tu cuenta fue registrada con éxito en la plataforma.</p>
            
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #000;">
              <p style="margin: 0; font-size: 16px;"><strong>Tu usuario para ingresar es:</strong><br/> ${userEmail}</p>
              <p style="margin: 8px 0 0 0; font-size: 0.85em; color: #6b7280;">(La contraseña es la que elegiste al completar el formulario)</p>
            </div>

            <p style="font-size: 16px; line-height: 1.6; color: #4b5563;">${paymentText}</p>
            
            <div style="text-align: center; margin-top: 40px;">
              <a href="https://dontquitprogram.com/login" style="display: inline-block; background-color: #000; color: #FAF3EF; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; text-transform: uppercase;">
                Ingresar a la App
              </a>
            </div>
          </div>
          <div style="background-color: #f9fafb; text-align: center; padding: 15px; font-size: 12px; color: #9ca3af; border-top: 1px solid #eee;">
            © ${new Date().getFullYear()} Don't Quit. Program
          </div>
        </div>
      `
    });

    if (error) {
      console.error("❌ Error en la API de Resend:", error);
      return;
    }

    console.log(`✉️ Mail de bienvenida enviado con éxito a ${userEmail} (ID: ${data?.id})`);

  } catch (error) {
    console.error("❌ Error crítico en la función sendWelcomeEmail:", error);
  }
};