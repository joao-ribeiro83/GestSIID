# dev/T vs dev/P — module differences

Generated 2026-09-14 by `analysis/tools/diff-xml.js` from the Forms2XML dumps in `analysis/forms-xml/{T,P}`. Attribute `DirtyInfo` ignored. Passwords masked.

## Files present in only one folder

- only in T: `FD_CONFIGURACAO_MODELOS_old_fmb.xml`
- only in T: `FD_GESTAO_SIID_v2_fmb.xml`

## Summary

| Module | Result | Code diffs | Text/label diffs | Layout-only diffs | Other attr diffs | Only in T | Only in P |
|---|---|---|---|---|---|---|---|
| FD_ALTERAR_PASSWORD | DIFFERENT | 0 | 0 | 0 | 2 | 0 | 0 |
| FD_BACKUPS_ONLINE | identical | 0 | 0 | 0 | 0 | 0 | 0 |
| FD_CONFIGURACAO_MODELOS | identical | 0 | 0 | 0 | 0 | 0 | 0 |
| FD_CONFIGURACAO_REPORTS | identical | 0 | 0 | 0 | 0 | 0 | 0 |
| FD_DOMINIOS_SIID | identical | 0 | 0 | 0 | 0 | 0 | 0 |
| FD_GESTAO_IMPRESSORAS_DOC | identical | 0 | 0 | 0 | 0 | 0 | 0 |
| FD_GESTAO_IMPRESSORAS_USR | identical | 0 | 0 | 0 | 0 | 0 | 0 |
| FD_GESTAO_SIID_USER | DIFFERENT | 0 | 0 | 0 | 1 | 0 | 0 |
| FD_GESTAO_SIID | identical | 0 | 0 | 0 | 0 | 0 | 0 |
| FD_GESTAO_USER | identical | 0 | 0 | 0 | 0 | 0 | 0 |
| FD_GESTAO | DIFFERENT | 1 | 0 | 0 | 0 | 0 | 0 |
| FD_GESTORES_SIID | identical | 0 | 0 | 0 | 0 | 0 | 0 |
| FD_IMPRESSORAS_SIID | identical | 0 | 0 | 0 | 0 | 0 | 0 |
| FD_LOGIN_SIID | DIFFERENT | 1 | 0 | 0 | 1 | 1 | 1 |
| FD_NOVO_BACKUP | identical | 0 | 0 | 0 | 0 | 0 | 0 |
| FD_PERFIS_DEPARTAMENTO | DIFFERENT | 1 | 0 | 0 | 0 | 1 | 0 |
| FD_PERMISSOES_SIID | identical | 0 | 0 | 0 | 0 | 0 | 0 |
| FD_TIPOS_MiDIA | identical | 0 | 0 | 0 | 0 | 0 | 0 |
| FD_UNIDADES_MEDIDA | identical | 0 | 0 | 0 | 0 | 0 | 0 |
| FD_UTILIZADORES_SIID | identical | 0 | 0 | 0 | 0 | 0 | 0 |
| FD_VARIAVEIS_SIID | identical | 0 | 0 | 0 | 0 | 0 | 0 |
| MD_SIID_USER | identical | 0 | 0 | 0 | 0 | 0 | 0 |
| MD_SIID | identical | 0 | 0 | 0 | 0 | 0 | 0 |

## FD_ALTERAR_PASSWORD

**Other property differences (2):**
- `Block[ALTERAR_PASSWORD]/Item[PASSWORD]` MaximumLength: T=`1000` → P=``
- `Block[ALTERAR_PASSWORD]/Item[CONFIRMACAO]` MaximumLength: T=`1000` → P=``


## FD_GESTAO_SIID_USER

**Other property differences (1):**
- `Block[CONFIRMAR_PASSWORD]/Item[PASSWORD]` MaximumLength: T=`1000` → P=``


## FD_GESTAO

**Code differences (1):**

`Trigger[WHEN-NEW-FORM-INSTANCE]` · TriggerText (− T / + P)

```diff
  	
  	Default_Value('*','GLOBAL.USERNAME');
- 	Default_Value('false','GLOBAL.IS_BEAN1_REGISTER');
- 	Default_Value('false','GLOBAL.IS_BEAN2_REGISTER');
    
    if :GLOBAL.USERNAME = '*' then
    	 Set_Window_Property(FORMS_MDI_WINDOW,WINDOW_STATE,Minimize);
    	 ALERT := SHOW_ALERT('OUT');
    	 EXIT_FORM(NO_VALIDATE);
    end if;
    
    Set_Item_Property('UTILIZADOR',PROMPT_TEXT,:GLOBAL.USERNAME);
    
    SELECT NVL(MAX(OWNER),USER)
    INTO   v_ambiente
    FROM   USER_TAB_PRIVS
    WHERE  PRIVILEGE  = 'INSERT'
    AND    TABLE_NAME = 'SVR_DOCUMENTO_COMENTARIOS'
    AND    GRANTEE    = USER;
  
  
    SELECT MAX(1)
    INTO   v_syns
    FROM   USER_SYNONYMS
    WHERE  TABLE_OWNER = v_ambiente
    AND    TABLE_NAME  = 'SVR_DOCUMENTO_COMENTARIOS';
  
    IF v_ambiente != USER THEN
    	Set_Menu_Item_Property('CONFIGURAÇÃO_MENU.GESTORES',VISIBLE,PROPERTY_FALSE);
    END IF;
  
    IF v_ambiente != USER AND v_syns IS NULL THEN
     	Create_Synonyms(v_ambiente);
    ELSIF v_ambiente = USER AND v_syns IS NOT NULL THEN
     	Drop_Synonyms;
    END IF;
    
    Set_Window_Property('GESTAO',TITLE,v_ambiente);
    Set_Item_Property('AMBIENTE',PROMPT_TEXT,v_ambiente);
    
  END;
```

## FD_LOGIN_SIID

**Only in T (1):**
- `Block[LOGIN]/Item[AMBIENTE]/ListItemElement[TESTES]`


**Only in P (1):**
- `Block[LOGIN]/Item[AMBIENTE]/ListItemElement[PRODUÇÃO]`


**Code differences (1):**

`Trigger[ON-LOGON]` · TriggerText (− T / + P)

```diff
  		v_password := '***';
  		--v_connect_string := '(DESCRIPTION=(ADDRESS_LIST=(ADDRESS=(PROTOCOL=TCP)(Host=***)(Port=1530)))(CONNECT_DATA=(SERVICE_NAME=COSEC)))';
- 		v_connect_string := 'cosec';
+ 		v_connect_string := 'gador';
  	END IF;
  	
  	IF :LOGIN.AMBIENTE = 'COSEC' THEN
- 		--v_username := 'DISC****';
- 		--v_password := '***';
-   	--v_connect_string := '(DESCRIPTION=(ADDRESS_LIST=(ADDRESS=(PROTOCOL=TCP)(Host=***)(Port=1521)))(CONNECT_DATA=(SERVICE_NAME=COSEC01)))';
- 		v_username := 'SIID****';
+ 		v_username := 'DISC****';
  		v_password := '***';
+ 		v_connect_string := 'COSEC01';
+   	--v_connect_string := '(DESCRIPTION=(ADDRESS_LIST=(ADDRESS=(PROTOCOL=TCP)(Host=***)(Port=1521)))(CONNECT_DATA=(SERVICE_NAME=COSEC01)))';
+ 		--v_username := 'SIID****';
+ 	--	v_password := '***';
  		--v_connect_string := '(DESCRIPTION=(ADDRESS_LIST=(ADDRESS=(PROTOCOL=TCP)(Host=***)(Port=1530)))(CONNECT_DATA=(SERVICE_NAME=COSEC)))';
- 		v_connect_string := 'cosec';
+ 		--v_connect_string := 'gador';
  
  	end if;
  
  	LOGON(v_username,v_password||'@'||v_connect_string,FALSE);
  	--LOGON('DISC****','***@(DESCRIPTION=(ADDRESS_LIST=(ADDRESS=(PROTOCOL=TCP)(Host=***)(Port=1530)))(CONNECT_DATA=(SERVICE_NAME=COSEC)))');
  	
  END;
  
  
  
  
```

**Other property differences (1):**
- `Block[LOGIN]/Item[AMBIENTE]` InitializeValue: T=`GADOR_TESTES` → P=`COSEC`


## FD_PERFIS_DEPARTAMENTO

**Only in T (1):**
- `Block[DOC_PERFIS_DEPARTAMENTO]/Item[IMAGEPICKER]`


**Code differences (1):**

`Menu[ASSINATURA]/MenuItem[ABRIR]` · MenuItemCode (− T / + P)

```diff
  DECLARE
-   filename VARCHAR2(2000); 
+   filename VARCHAR2(256); 
    extFILE  	VARCHAR2(10);
  BEGIN  
- 	If :GLOBAL.IS_BEAN2_REGISTER = 'false' Then
-   	FBean.Register_Bean('DOC_PERFIS_DEPARTAMENTO.IMAGEPICKER',1,'oracle.forms.fd.GetImageFileName');  
-   	:GLOBAL.IS_BEAN2_REGISTER := 'true' ;  
- 	End if ;
- 	--filename := GET_FILE_NAME(File_Filter=> 'BMP Files (*.bmp)|*.bmp|'||'JPG Files (*.jpg)|*.jpg|'||'All Files (*.*)|*.*|');
- 	filename := FBean.Invoke_char('DOC_PERFIS_DEPARTAMENTO.IMAGEPICKER',1,'GetFile','"Select an image file name","C:\"');
+ 	filename := GET_FILE_NAME(File_Filter=> 'BMP Files (*.bmp)|*.bmp|'||'JPG Files (*.jpg)|*.jpg|'||'All Files (*.*)|*.*|');
  	READ_IMAGE_FILE(filename, upper(substr(filename, instr(filename,'.')+1)), 'DOC_SECCOES_DOCUMENTO.IMAGEM');
  END; 
  
```
