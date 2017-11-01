########################################################
# Dockerfile to build CryptoMashup
# Based on Ubuntu
########################################################

# Set the base image to Ubuntu
FROM ubuntu

# File Author / Maintainer
MAINTAINER Lachlan Pond and Luke Pritchard


# Install basic applications, Node, npm, express
RUN apt-get update && apt-get install -y \
	build-essential \
	curl \
	nodejs-legacy \
	npm

RUN npm install npm \
	npm install express --save \
	npm install tsv \
	npm install natural \
	npm install twitter \
	npm install body-parser \
	npm install sentiment \
	npm install country-data \
	npm install cities-list \
	npm install @google/maps \
	npm install check-word \
	npm install people-names \
	npm install pm2 -g


# Copy the server and node_module folders into the docker app
ADD . .
ADD /node_modules /node_modules

# Expose ports
EXPOSE 3000

# Set the default directory where CMD will execute
WORKDIR .

# Start the simple express server to host the static html page
CMD pm2-docker server