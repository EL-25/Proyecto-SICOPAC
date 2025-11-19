-- 1. Crear base de datos
CREATE DATABASE SistemaAlcaldia;
GO

-- 2. Usar la base recién creada
USE SistemaAlcaldia;
GO

-- 3. Crear tabla Usuarios
CREATE TABLE Usuarios (
  Id INT PRIMARY KEY IDENTITY(1,1),
  Usuario NVARCHAR(50) NOT NULL UNIQUE,
  Clave NVARCHAR(255) NOT NULL, -- Contraseña cifrada
  NombreCompleto NVARCHAR(100) NOT NULL,
  Rol NVARCHAR(50) DEFAULT 'Administrador',
  Estado BIT DEFAULT 1, -- 1 = activo, 0 = inactivo
  FechaRegistro DATETIME DEFAULT GETDATE()
);
GO

-- 4. Crear tabla Formularios
CREATE TABLE Formularios (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    NumeroFormulario AS (FORMAT(Id, '00000')),
    
    NombreSolicitante NVARCHAR(150) NOT NULL,
    Municipio NVARCHAR(100) NOT NULL,
    Distrito NVARCHAR(100) NOT NULL,
    FechaPresentacion DATE NOT NULL,
    HoraPresentacion TIME NULL,
    Telefono NVARCHAR(20) NULL,
    Correo NVARCHAR(120) NULL,
    Declaraciones NVARCHAR(MAX) NULL,
    DescripcionDocumentacion NVARCHAR(MAX) NULL,
    
    FechaRegistro DATETIME DEFAULT GETDATE()
);
GO

-- 5. Crear tabla Acciones
CREATE TABLE Acciones (
  Id INT IDENTITY(1,1) PRIMARY KEY,
  Usuario NVARCHAR(50) NOT NULL,
  TipoAccion NVARCHAR(100) NOT NULL,
  Declaracion NVARCHAR(100) NULL,
  CodigoFormulario NVARCHAR(30) NULL,
  Municipio NVARCHAR(100) NULL,
  Distrito NVARCHAR(100) NULL,
  FechaHoraServidor DATETIME NOT NULL DEFAULT GETDATE(),
  FechaHoraLocal NVARCHAR(40) NULL
);

CREATE INDEX IX_Acciones_Usuario ON Acciones (Usuario);
CREATE INDEX IX_Acciones_Declaracion ON Acciones (Declaracion);
CREATE INDEX IX_Acciones_Municipio ON Acciones (Municipio);
CREATE INDEX IX_Acciones_Distrito ON Acciones (Distrito);
CREATE INDEX IX_Acciones_CodigoFormulario ON Acciones (CodigoFormulario);
CREATE INDEX IX_Acciones_FechaHoraServidor ON Acciones (FechaHoraServidor);

DELETE FROM Acciones;
DBCC CHECKIDENT ('Acciones', RESEED, 0);

-- . Insertar usuario inicial
INSERT INTO Usuarios (Usuario, Clave, NombreCompleto, Rol, Estado)
VALUES ('Edwin Leiva', 'Admin2421', 'Administrador de la Base de Datos', 'Administrador', 1);
GO

-- . Crear login y usuario con permisos
CREATE LOGIN DATABASEUDBEDWIN WITH PASSWORD = 'EdwinBD31';
GO

CREATE USER UDBbasedatos FOR LOGIN DATABASEUDBEDWIN;
GO

ALTER ROLE db_owner ADD MEMBER UDBbasedatos;
GO

-- . Añadir columnas adicionales
ALTER TABLE Usuarios ADD Correo NVARCHAR(100);
ALTER TABLE Usuarios ADD Firma VARCHAR(100);
GO

-- . Actualizar datos del usuario
UPDATE Usuarios
SET Correo = 'edwin.leiva@lalibertad.gob.sv',
    NombreCompleto = 'Edwin Daniel Leiva Barrera',
    Rol = 'Administrador de la Base de Datos',
    Firma = 'Firma EL.png'
WHERE Usuario = 'Edwin Leiva';
GO

-- . Limpiar tabla y reseed
DELETE FROM Usuarios WHERE Id <> 1;
GO

DBCC CHECKIDENT ('Usuarios', RESEED, 1);
GO

--. Limpiar tabla Formularios

-- Elimina todos los registros
DELETE FROM Formularios;

-- Reinicia el contador de identidad (Id) a 1
DBCC CHECKIDENT ('Formularios', RESEED, 0);
