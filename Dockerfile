# Use Node 20 as the base image
FROM node:20 AS build

# Set the working directory inside the container
WORKDIR /know

# Copy package.json and yarn.lock to install dependencies
COPY package.json yarn.lock ./

# Install all dependencies, including devDependencies
RUN yarn install

# Copy the rest of the application code
COPY . .

# Build the NestJS app (this will create the dist folder)
RUN yarn build

# Stage 2: Production image
FROM node:20

# Set the working directory inside the container
WORKDIR /know

# Copy only package.json and yarn.lock to install production dependencies
COPY package.json yarn.lock ./

# Install only production dependencies
RUN yarn install --production

# Copy the built files from the build stage (including dist)
COPY --from=build /know/dist /know/dist

# Expose the default NestJS port
EXPOSE 7040

# Start the NestJS app in production mode
CMD ["yarn", "start:prod"]