-- TIPO_ROL (owner: SIID_TESTES)


-- ===== FUNCTION =====

FUNCTION Tipo_rol (wcdramo number,wcdrol varchar2)RETURN varchar2 IS
   rol varchar2(2);
BEGIN
 If wcdrol = 'CDROLTOM' THEN
   select CDROLTOM
     into rol
     from mparapro
    where cdramo = wcdramo;
     return (rol);
 Elsif wcdrol = 'CDROLASE' Then
    select CDROLASE
      into rol
      from mparapro
     where cdramo = wcdramo;
        return (rol);
 Elsif wcdrol = 'CDROLRIE' Then
    select CDROLRIE
      into rol
      from mparapro
     where cdramo = wcdramo;
        return (rol);
 Elsif wcdrol ='CDROLADE' Then
     select CDROLADE
       into rol
       from mparapro
      where cdramo = wcdramo;
     return (rol);
 Elsif wcdrol ='CDROLOTO' Then
     select CDROLOTO
       into rol
       from mparapro
      where cdramo = wcdramo;
      return (rol);
End if;

RETURN NULL;

Exception
   when no_data_found Then
     RETURN NULL;
END;

