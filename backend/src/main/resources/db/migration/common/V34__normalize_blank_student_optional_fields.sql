UPDATE students SET email = NULL WHERE email IS NOT NULL AND TRIM(email) = '';
UPDATE students SET id_no = NULL WHERE id_no IS NOT NULL AND TRIM(id_no) = '';
UPDATE students SET mobile = NULL WHERE mobile IS NOT NULL AND TRIM(mobile) = '';
UPDATE students SET whatsapp = NULL WHERE whatsapp IS NOT NULL AND TRIM(whatsapp) = '';
UPDATE students SET university = NULL WHERE university IS NOT NULL AND TRIM(university) = '';
UPDATE students SET current_year = NULL WHERE current_year IS NOT NULL AND TRIM(current_year) = '';
UPDATE students SET address = NULL WHERE address IS NOT NULL AND TRIM(address) = '';
