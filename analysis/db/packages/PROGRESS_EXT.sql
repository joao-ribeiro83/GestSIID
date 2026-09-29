-- PROGRESS_EXT (owner: SIID_TESTES)


-- ===== FUNCTION =====

FUNCTION progress_ext(p_extents IN NUMBER, p_initial IN NUMBER, p_increase IN NUMBER) RETURN NUMBER
IS
  valor NUMBER := p_initial;
  blocos number;
BEGIN
  IF p_extents = 1 THEN
    RETURN valor;
  ELSE
    valor :=progress_ext(p_extents-1, p_initial, p_increase);
    blocos:=valor/8192;
    if blocos != trunc(blocos) then
      valor := ceil(blocos)*8192;
    end if;
    RETURN valor;
  END IF;
END;

