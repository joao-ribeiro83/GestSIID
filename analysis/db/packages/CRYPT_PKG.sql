-- CRYPT_PKG (owner: SIID_TESTES)


-- ===== SPEC (PACKAGE) =====

package crypt_pkg as

	function encryptString( p_data in varchar2,  p_key  in varchar2 default NULL ) return varchar2;
    
    function encryptStringRaw( p_data in varchar2,  p_key  in varchar2 default NULL ) return raw;

	function decryptString( p_data in varchar2, p_key  in varchar2 default NULL ) return varchar2;

	function encryptRaw( p_data in raw, p_key in raw default NULL ) return raw;

	function decryptRaw( p_data in raw, p_key in raw default NULL ) return raw;

	function encryptLob( p_data in clob, p_key  in varchar2 default NULL ) return clob;

	function encryptLob( p_data in blob, p_key  in raw default NULL ) return blob;

	function decryptLob( p_data in clob, p_key  in varchar2 default NULL ) return clob;

	function decryptLob( p_data in blob,p_key  in raw default NULL ) return blob;

	subtype checksum_str is varchar2(16);
	subtype checksum_raw is raw(16);

	function md5str( p_data in varchar2 ) return checksum_str;

	function md5raw( p_data in raw ) return checksum_raw;

	function md5lob( p_data in clob ) return checksum_str;

	function md5lob( p_data in blob ) return checksum_raw;

	procedure setKey( p_key in varchar2 );

end;

-- ===== BODY (PACKAGE BODY) =====

package body crypt_pkg as
	-- package globals
	g_charkey         varchar2(48) := 'Onsite@Cosec';
	g_stringFunction  varchar2(1);
	g_rawFunction     varchar2(1);
	g_stringWhich     varchar2(75);
	g_rawWhich        varchar2(75);
	g_chunkSize       CONSTANT number default 32000;

	function padstr( p_str in varchar2 ) return varchar2 as
		l_len number default length(p_str);

	begin
		return to_char(l_len,'fm00000009') || rpad(p_str, ( trunc(l_len/8)+sign(mod(l_len,8)) )*8, chr(0));
	end;

	function padraw( p_raw in raw ) return raw as
		l_len number default utl_raw.length(p_raw);
	begin
		return utl_raw.concat( utl_raw.cast_to_raw(to_char(l_len,'fm00000009')), p_raw, utl_raw.cast_to_raw( rpad(chr(0), (8-mod(l_len,8))*sign(mod(l_len,8)), chr(0))));
	end;

	function unpadstr( p_str in varchar2 ) return varchar2 is
	begin
		return substr( p_str, 9, to_number(substr(p_str,1,8)) );
	end;

	function unpadraw( p_raw in raw ) return raw is
	begin
		return utl_raw.substr( p_raw, 9, to_number( utl_raw.cast_to_varchar2(utl_raw.substr(p_raw,1,8)) ) );
	end;

	procedure wa( p_clob in out clob, p_buffer in varchar2 )  is
	begin
		dbms_lob.writeappend(p_clob,length(p_buffer),p_buffer);
	end;

	procedure wa( p_blob in out blob, p_buffer in raw )  is
	begin
		dbms_lob.writeappend(p_blob,utl_raw.length(p_buffer),p_buffer);
	end;

	procedure setKey( p_key in varchar2 ) as
	begin
		if ( g_charkey = p_key OR p_key is NULL ) then
			return;
		end if;

		g_charkey := p_key;

		if ( length(g_charkey) not in ( 8, 16, 24, 16, 32, 48 ) ) then
			raise_application_error( -20001, 'Key must be 8, 16, or 24 bytes' );
		end if;

		SELECT decode(length(g_charkey), 8, '', '3')
			,decode(length(g_charkey), 8, '', 16, '', 24, ', which = > dbms_obfuscation_toolkit.ThreeKeyMode')
			,decode(length(g_charkey), 16, '', '3')
			,decode(length(g_charkey), 16, '', 32, '', 48, ', which = > dbms_obfuscation_toolkit.ThreeKeyMode')
		INTO g_stringFunction
			,g_stringWhich
			,g_rawFunction
			,g_rawWhich
		FROM dual
		;
	end;

	function encryptString( p_data in varchar2,
		p_key in varchar2 default NULL ) return varchar2
	as
		l_encrypted long;

	begin
		setkey(p_key);

		execute immediate
			'begin
			dbms_obfuscation_toolkit.des' || g_StringFunction || 'encrypt
			( input_string => :1, key_string => :2, encrypted_string => :3' ||
			g_stringWhich || ' );
			end;'
		using IN padstr(p_data), IN g_charkey, IN OUT l_encrypted;

		return l_encrypted;
	end;
    
    function encryptStringRaw( p_data in varchar2,
		p_key in varchar2 default NULL ) return raw
	as
		l_encrypted long;

	begin
		setkey(p_key);

		execute immediate
			'begin
			dbms_obfuscation_toolkit.des' || g_StringFunction || 'encrypt
			( input_string => :1, key_string => :2, encrypted_string => :3' ||
			g_stringWhich || ' );
			end;'
		using IN padstr(p_data), IN g_charkey, IN OUT l_encrypted;

		return UTL_RAW.cast_to_raw(l_encrypted);
	end;

	function encryptRaw( p_data in raw,
		p_key in raw default NULL ) return raw
	as
		l_encrypted long raw;
	begin
		setkey(p_key);

		execute immediate
			'begin
			dbms_obfuscation_toolkit.des' || g_RawFunction || 'encrypt
			( input => :1, key => :2, encrypted_data => :3' ||
			g_rawWhich || ' );
			end;'
		using IN padraw( p_data ), IN hextoraw(g_charkey), IN OUT l_encrypted;

		return l_encrypted;
	end;

	function decryptString( p_data in varchar2,
		p_key in varchar2 default NULL ) return varchar2
	as
		l_string long;
	begin
		setkey(p_key);

		execute immediate
			'begin
			dbms_obfuscation_toolkit.des' || g_StringFunction || 'decrypt
			( input_string => :1, key_string => :2, decrypted_string => :3' ||
			g_stringWhich || ' );
			end;'
		using IN p_data, IN g_charkey, IN OUT l_string;

		return unpadstr( l_string );
	end;

	function decryptRaw( p_data in raw,
		p_key in raw default NULL ) return raw
	as
		l_string long raw;
	begin
		setkey(p_key);

		execute immediate
			'begin
			dbms_obfuscation_toolkit.des' || g_RawFunction || 'decrypt
			( input => :1, key => :2, decrypted_data => :3 ' ||
			g_rawWhich || ' );
			end;'
		using IN p_data, IN hextoraw(g_charkey), IN OUT l_string;

		return unpadraw( l_string );
	end;

	function encryptLob( p_data in clob,
		p_key in varchar2 ) return clob
	as
		l_clob clob;
		l_offset number default 1;
		l_len number default dbms_lob.getlength(p_data);
	begin
		setkey(p_key);

		dbms_lob.createtemporary( l_clob, TRUE );

		while ( l_offset <= l_len )
		loop
			wa( l_clob, encryptString(
			dbms_lob.substr( p_data, g_chunkSize, l_offset ) ) );
			l_offset := l_offset + g_chunksize;
		end loop;

		return l_clob;
	end;

	function encryptLob( p_data in blob,
		p_key in raw ) return blob
	as
		l_blob blob;
		l_offset number default 1;
		l_len number default dbms_lob.getlength(p_data);
	begin
		setkey(p_key);

		dbms_lob.createtemporary( l_blob, TRUE );

		while ( l_offset <= l_len )
		loop
			wa( l_blob, encryptRaw(
			dbms_lob.substr( p_data, g_chunkSize, l_offset ) ) );
			l_offset := l_offset + g_chunksize;
		end loop;

		return l_blob;
	end;

	function decryptLob( p_data in clob,
		p_key in varchar2 default NULL ) return clob
	as
		l_clob clob;
		l_offset number default 1;
		l_len number default dbms_lob.getlength(p_data);
	begin
		setkey(p_key);

		dbms_lob.createtemporary( l_clob, TRUE );

		loop
			exit when l_offset > l_len;

			wa( l_clob, decryptString(
			dbms_lob.substr( p_data, g_chunksize+8, l_offset ) ) );
			l_offset := l_offset + 8 + g_chunksize;
		end loop;

		return l_clob;
	end;

	function decryptLob( p_data in blob,
		p_key in raw default NULL ) return blob
	as
		l_blob blob;
		l_offset number default 1;
		l_len number default dbms_lob.getlength(p_data);
	begin
		setkey(p_key);

		dbms_lob.createtemporary( l_blob, TRUE );

		loop
			exit when l_offset > l_len;

			wa( l_blob, decryptRaw(
			dbms_lob.substr( p_data, g_chunksize+8, l_offset ) ) );
			l_offset := l_offset + 8 + g_chunksize;
		end loop;

		return l_blob;
	end;

	function md5str( p_data in varchar2 ) return checksum_str
	is
		l_checksum_str checksum_str;
	begin
		execute immediate
			'begin :x := dbms_obfuscation_toolkit.md5( input_string => :y ); end;'
		using OUT l_checksum_str, IN p_data;

		return l_checksum_str;
	end;

	function md5raw( p_data in raw ) return checksum_raw
	is
		l_checksum_raw checksum_raw;
	begin
		execute immediate
			'begin :x := dbms_obfuscation_toolkit.md5( input => :y ); end;'
		using OUT l_checksum_raw, IN p_data;

		return l_checksum_raw;
	end;

	function md5lob( p_data in clob ) return checksum_str
	is
		l_checksum_str checksum_str;
	begin
		execute immediate
			'begin :x := dbms_obfuscation_toolkit.md5( input_string => :y ); end;'
		using OUT l_checksum_str, IN dbms_lob.substr(p_data,g_chunksize,1);

		return l_checksum_str;
	end;

	function md5lob( p_data in blob ) return checksum_raw
	is
		l_checksum_raw checksum_raw;
	begin
		execute immediate
			'begin :x := dbms_obfuscation_toolkit.md5( input => :y ); end;'
		using OUT l_checksum_raw, IN dbms_lob.substr(p_data,g_chunksize,1);

		return l_checksum_raw;
	end;
end;
