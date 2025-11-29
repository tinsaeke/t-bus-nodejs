-- This script creates the 'partner_cities' table, which links bus companies (partners) to the cities they operate in.
-- This is a many-to-many join table between 'bus_companies' and 'cities'.

CREATE TABLE IF NOT EXISTS partner_cities (
    partner_id INT NOT NULL,
    city_id INT NOT NULL,
    
    -- Define the composite primary key to prevent a partner from being linked to the same city more than once.
    PRIMARY KEY (partner_id, city_id),
    
    -- Add foreign key constraints to ensure data integrity.
    CONSTRAINT fk_partner FOREIGN KEY (partner_id) REFERENCES bus_companies(id) ON DELETE CASCADE,
    CONSTRAINT fk_city FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE CASCADE
);

-- Add a comment to the table for clarity in database tools.
COMMENT ON TABLE partner_cities IS 'Links bus company partners to the cities they service.';