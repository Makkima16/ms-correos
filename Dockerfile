# Usar una imagen base que ya tenga Python
FROM python:3.9-slim

# Establecer el directorio de trabajo
WORKDIR /app

# Copiar los archivos del proyecto a la imagen
COPY . /app

# Instalar las dependencias de Python
RUN pip install --upgrade pip && pip install -r requirements.txt

# Instalar las dependencias de Node.js
RUN npm install

# Exponer el puerto en el que tu aplicación escuchará
EXPOSE 3000

# Iniciar la aplicación
CMD ["npm", "start"]
