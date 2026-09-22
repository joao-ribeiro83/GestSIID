-- FESUPLOG (owner: SIID_TESTES)


-- ===== FUNCTION =====

function fesuplog (
  p_cdunieco NUMBER
, p_cdramo   NUMBER
, p_estado   VARCHAR2
, p_nmpoliza NUMBER
, p_nmsuplem NUMBER
)
return date
is
  v_fesuplog DATE;
begin
  select max(feemisio)
  into   v_fesuplog
  from   tdescsup supl
  ,      msupleme supf
  where  supl.nsuplogi = supf.nsuplogi
  and    supl.nmpoliza = supf.nmpoliza
  and    supl.estado   = supf.estado
  and    supl.cdramo   = supf.cdramo
  and    supl.cdunieco = supf.cdunieco
  and    supf.nmsuplem = p_nmsuplem
  and    supf.nmpoliza = p_nmpoliza
  and    supf.estado   = p_estado
  and    supf.cdramo   = p_cdramo
  and    supf.cdunieco = p_cdunieco;
  return v_fesuplog;
end;

