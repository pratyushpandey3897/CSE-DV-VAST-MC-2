-- Create an index on the travelStartTime column
CREATE INDEX idx_travel_start_time ON TravelJournal(travelStartTime);

-- Create an index on the travelEndTime column
CREATE INDEX idx_travel_end_time ON TravelJournal(travelEndTime);

-- Create an index on the checkInTime column
CREATE INDEX idx_check_in_time ON TravelJournal(checkInTime);

-- Create an index on the checkOutTime column
CREATE INDEX idx_check_out_time ON TravelJournal(checkOutTime);

-- Create an index on the purpose column
CREATE INDEX idx_purpose ON TravelJournal(purpose);

-- Create an index on the timeOfDay column
CREATE INDEX idx_tjc_tod ON TravelJournal(timeOfDay);

-- Create an index on the startLocationType column
CREATE INDEX idx_location ON Location(location);

-- Create an index on the startLocationType column
CREATE INDEX idx_building_type ON Location(buildingType);