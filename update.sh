#!/bin/bash

OLD_COMMIT=`git rev-parse --short HEAD`

# Pull the latest code
git pull

# Get the current commit hash
CURRENT_COMMIT=`git rev-parse --short HEAD`

# Build the latest code and/or restart the containers
if [ $OLD_COMMIT == $CURRENT_COMMIT ]; then
	docker compose up -d
else
	docker compose up --build -d
fi

# Check whether to re-upload the schema
read -n1 -p "Do you want to run database migration? [Y/n]" DO_MIGRATE

# Migrate the database
if [ $DO_MIGRATE == "n" ]; then
	echo "Skipping database migration!"
else
	docker cp ./Base.sql airsensor-mssql-1:/Base.sql
	docker exec airsensor-mssql-1 /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "<YourStrong@Passw0rd>" -i /Base.sql
	docker restart airsensor-airsensor-1
fi

echo "Done!"

exit 0
