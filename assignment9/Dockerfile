# Configures an Express web server and copies the current folder content
# to use as app root.

# Use the following commands to build and run the server.
#   docker build -t express-server .
#   docker run -d -p 3000:3000 --name=express-server express-server

# Then open a web browser and connect to http://localhost:3000 .

# References:
#   https://code.visualstudio.com/docs/containers/quickstart-node
#   https://docs.docker.com/develop/develop-images/dockerfile_best-practices/

FROM node:alpine
WORKDIR /usr/src/app

COPY . .
RUN npm install express handlebars os express-fileupload node-fetch@2

EXPOSE 3000
CMD ["node", "app.js"]
