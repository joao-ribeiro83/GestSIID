-- F_BMP2JPG (owner: SIID_TESTES)


-- ===== FUNCTION =====

FUNCTION f_bmp2jpg(p_bmp_image blob) RETURN blob AS
language java name 'Bmp2JPG.convert2JPG(oracle.sql.BLOB) return oracle.sql.BLOB'
;
