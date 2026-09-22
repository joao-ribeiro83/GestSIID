-- PKG_HLA (owner: SIID_TESTES)


-- ===== SPEC (PACKAGE) =====

PACKAGE PKG_hla AS
/*
  NOME      : FUN_nulo
   *  OBJECTIVO : FUNC?O se for 0 retorna nulo
   *  UTILIZAC?O: EJEMPLO :
   *  VERS?O    : 1.0
   *  CRIADO POR: Henrique Anselmo
*/
FUNCTION FUN_nulo (n number) RETURN number ;
END PKG_hla;


-- ===== BODY (PACKAGE BODY) =====

PACKAGE BODY PKG_hla AS
FUNCTION fun_nulo (n number) RETURN number IS
  BEGIN
 if n=0 or n=999.9 then
  return null;
 end if;
 return n;
  END;
END PKG_hla;

