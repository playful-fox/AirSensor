USE master
-- check database exists
IF DB_ID ('aqi_db') IS NOT NULL
    DROP DATABASE aqi_db;
GO
-- create database
CREATE DATABASE aqi_db;
GO

-- create table
USE aqi_db;

CREATE TABLE Data
(
    ID INT IDENTITY(1,1),
    O3 float,
    CO float,
    TEMP float,
    RH float,
    PM1_0 int,
    PM2_5 int,
    PM10 int,
    UP_DATE DATETIME DEFAULT GETDATE(),
    UP_EQU CHAR(50)
);
CREATE TABLE Access
(
    ID INT IDENTITY(1,1),
    USER_ID char(200),
    USER_EQU char(200)
)
    GO
INSERT INTO Data
( O3, CO, TEMP, RH, PM1_0, PM2_5, PM10, UP_EQU)
VALUES
( 1, 2, 3, 4, 5, 6, 7, 'AAA-111AAA-AAA')
GO
INSERT INTO Access
(USER_EQU)
VALUES
('AAA-111AAA-AAA')
GO
