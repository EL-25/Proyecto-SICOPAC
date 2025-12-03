CREATE DATABASE SistemaAlcaldia;
GO

USE SistemaAlcaldia;
GO

CREATE TABLE Usuarios (
  Id INT PRIMARY KEY IDENTITY(1,1),
  Usuario NVARCHAR(50) NOT NULL UNIQUE,
  Clave NVARCHAR(255) NOT NULL, -- Contrase�a cifrada
  NombreCompleto NVARCHAR(100) NOT NULL,
  Rol NVARCHAR(50) DEFAULT 'Administrador',
  Estado BIT DEFAULT 1, -- 1 = activo, 0 = inactivo
  FechaRegistro DATETIME DEFAULT GETDATE()
);
GO

INSERT INTO Usuarios (Usuario, Clave, NombreCompleto, Rol, Estado)
VALUES ('Edwin Leiva', 'Admin2421', 'Administrador de la Base de Datos', 'Administrador', 1);

CREATE LOGIN UDBbasedatos WITH PASSWORD = 'Bunny&Sae20';
USE SistemaAlcaldia;
CREATE USER UDBbasedatos FOR LOGIN UDBbasedatos;
ALTER ROLE db_owner ADD MEMBER UDBbasedatos;

ALTER TABLE Usuarios ADD Correo NVARCHAR(100);

UPDATE Usuarios
SET Correo = 'edwin.leiva@lalibertad.gob.sv'
WHERE Usuario = 'Edwin Leiva';

UPDATE Usuarios
SET NombreCompleto = 'Edwin Daniel Leiva Barrera'
WHERE Usuario = 'Edwin Leiva';

UPDATE Usuarios
SET Rol = 'Administrador de la Base de Datos'
WHERE Usuario = 'Edwin Leiva';

INSERT INTO Usuarios (Usuario, Clave, NombreCompleto, Rol, Estado, Correo)
VALUES ('Cesar_M', '', 'C�sar Mel�ndez', 'Dise�ador', 1, 'cesar.melendez@lalibertad.gob.sv');

UPDATE Usuarios
SET Clave = ''
WHERE Usuario = 'Cesar_M';
