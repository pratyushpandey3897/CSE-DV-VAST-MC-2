-- Create the Participants table
CREATE TABLE Participants (
    participantId INTEGER PRIMARY KEY,
    householdSize INTEGER,
    haveKids BOOLEAN,
    age INTEGER,
    educationLevel TEXT,
    interestGroup CHAR,
    joviality REAL
);

-- Create the Apartments table
CREATE TABLE Apartments (
    apartmentId INTEGER PRIMARY KEY,
    rentalCost REAL,
    maxOccupancy INTEGER,
    numberOfRooms INTEGER,
    location POINT,
    buildingId INTEGER
);

-- Create the Buildings table
CREATE TABLE Buildings (
    buildingId INTEGER PRIMARY KEY,
    location POLYGON,
    buildingType TEXT,
    maxOccupancy INTEGER,
    units TEXT
);

-- Create the Employers table
CREATE TABLE Employers (
    employerId INTEGER PRIMARY KEY,
    location POINT,
    buildingId INTEGER
);

-- Create the Jobs table
CREATE TABLE Jobs (
    jobId INTEGER PRIMARY KEY,
    employerId INTEGER,
    hourlyRate REAL,
    startTime DATETIME,
    endTime DATETIME,
    daysToWork TEXT,
    educationRequirement TEXT
);

-- Create the Pubs table
CREATE TABLE Pubs (
    pubId INTEGER PRIMARY KEY,
    hourlyCost REAL,
    maxOccupancy INTEGER,
    location POINT,
    buildingId INTEGER
);

-- Create the Restaurants table
CREATE TABLE Restaurants (
    restaurantId INTEGER PRIMARY KEY,
    foodCost REAL,
    maxOccupancy INTEGER,
    location POINT,
    buildingId INTEGER
);

-- Create the Schools table
CREATE TABLE Schools (
    schoolId INTEGER PRIMARY KEY,
    monthlyFees REAL,
    maxEnrollment INTEGER,
    location POINT,
    buildingId INTEGER
);

-- Create the CheckinJournal table
CREATE TABLE CheckinJournal (
    participantId INTEGER,
    timestamp DATETIME,
    venueId INTEGER,
    venueType TEXT
);

-- Create the FinancialJournal table
CREATE TABLE FinancialJournal (
    participantId INTEGER,
    timestamp DATETIME,
    category TEXT,
    amount REAL
);

-- Create the SocialNetwork table
CREATE TABLE SocialNetwork (
    timestamp DATETIME,
    participantIdFrom INTEGER,
    participantIdTo INTEGER
);

-- Create the TravelJournal table
CREATE TABLE TravelJournal (
    participantId INTEGER,
    travelStartTime DATETIME,
    travelStartLocationId INTEGER,
    travelEndTime DATETIME,
    travelEndLocationId INTEGER,
    purpose TEXT,
    checkInTime DATETIME,
    checkOutTime DATETIME,
    startingBalance REAL,
    endingBalance REAL
);

-- Create the Activity Logs table (Multiple tables named ParticipantStatusLogs<n>)
CREATE TABLE IF NOT EXISTS ParticipantStatusLogs (
    timestamp DATETIME,
    currentLocation POINT,
    participantId INTEGER,
    currentMode TEXT,
    hungerStatus TEXT,
    sleepStatus TEXT,
    apartmentId INTEGER,
    availableBalance REAL,
    jobId INTEGER,
    financialStatus TEXT,
    dailyFoodBudget REAL,
    weeklyExtraBudget REAL
);

-- Create the Location table
CREATE TABLE IF NOT EXISTS Location (
    buildingId INTEGER PRIMARY KEY,
    location POINT,
    buildingType TEXT CHECK(buildingType in ('Restaurant', 'Pub', 'School', 'Apartment', 'Workplace'))
);