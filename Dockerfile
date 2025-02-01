# Usar una imagen base que tenga Node.js
FROM node:16-buster-slim

# Instalar Python y pip
RUN apt-get update && apt-get install -y python3-pip

# Establecer el directorio de trabajo en el contenedor
WORKDIR /app

# Copiar los archivos del proyecto al contenedor
COPY . /app

# Instalar las dependencias de Python
RUN pip3 install -r requirements.txt

# Instalar las dependencias de Node.js
RUN npm install

# Exponer el puerto en el que tu aplicación escuchará (ajusta si es necesario)
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["npm", "start"]
