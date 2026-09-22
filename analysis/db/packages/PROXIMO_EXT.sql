-- PROXIMO_EXT (owner: SIID_TESTES)


-- ===== FUNCTION =====

FUNCTION proximo_ext(p_extents IN NUMBER, p_initial IN NUMBER, p_increase IN NUMBER) RETURN NUMBER
IS
  valor NUMBER := p_initial;
  blocos number;
BEGIN
  IF P_EXTENTS = 0 THEN
    RETURN VALOR;
  ELSIF p_extents = 1 THEN
    valor:=valor+valor*p_increase/100;
    blocos:=valor/8192;
    if blocos != trunc(blocos) then
      valor:=ceil(blocos)*8192;
    end if;
    return valor;
  ELSE
    valor :=proXIMO_ext(p_extents-1, p_initial, p_increase);
    VALOR := VALOR+VALOR*P_INCREASE/100;
    blocos:=valor/8192;
    if blocos != trunc(blocos) then
      valor := ceil(blocos)*8192;
    end if;
    RETURN valor;
  END IF;
END;

