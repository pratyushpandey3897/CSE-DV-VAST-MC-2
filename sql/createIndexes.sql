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

-- Create an index on the purpose column
CREATE INDEX idx_tod_purpose ON TravelJournalWithTimeOfDayAndMonth(purpose);

-- Create an index on the purpose column
CREATE INDEX idx_tod ON TravelJournalWithTimeOfDayAndMonth(timeOfDay);

-- Create an index on the purpose column
CREATE INDEX idx_tod_month ON TravelJournalWithTimeOfDayAndMonth(month);

-- Create an index on the buildingId column
CREATE INDEX idx_apt_building_id ON Apartments(buildingId);

-- Create an index on the buildingId column
CREATE INDEX idx_pubs_building_id ON Pubs(buildingId);

-- Create an index on the buildingId column
CREATE INDEX idx_rest_building_id ON Restaurants(buildingId);

-- Create an index on the buildingId column
CREATE INDEX idx_school_building_id ON Schools(buildingId);

-- Create an index on the buildingType column
CREATE INDEX idx_building_type ON Buildings(buildingType);