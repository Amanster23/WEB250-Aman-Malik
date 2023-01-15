# Configures a Node runner and copies the current folder content
# to use as the program source.

# Use the following commands to build and run the server.
#   docker build -t node-runner .
#   docker run --rm node-runner

FROM node:alpine

WORKDIR /usr/src/app
COPY . .

CMD ["node", "app.js"]
