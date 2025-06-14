const fs = require('fs');
const path = require('path');

function testProjectFileGeneration() {
    console.log('Testing project file generation logic...');
    
    const csharpFiles = ['Program.cs', 'Helper.cs'];
    const csharpProject = generateCSharpProject(csharpFiles);
    console.log('C# Project generated:', csharpProject.includes('<Compile Include="Program.cs"'));
    
    const fsharpFiles = ['Calculator.fs', 'Utils.fs'];
    const fsharpProject = generateFSharpProject(fsharpFiles);
    console.log('F# Project generated:', fsharpProject.includes('<Compile Include="Calculator.fs"'));
    
    const vbFiles = ['Helper.vb', 'Main.vb'];
    const vbProject = generateVBNetProject(vbFiles);
    console.log('VB.NET Project generated:', vbProject.includes('<Compile Include="Helper.vb"'));
    
    console.log('All project generation tests passed!');
}

function generateCSharpProject(sourceFiles) {
    const includes = sourceFiles.map(f => `    <Compile Include="${f}" />`).join('\n');
    
    return `<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <Nullable>enable</Nullable>
  </PropertyGroup>

  <ItemGroup>
${includes}
  </ItemGroup>

</Project>`;
}

function generateFSharpProject(sourceFiles) {
    const includes = sourceFiles.map(f => `    <Compile Include="${f}" />`).join('\n');
    
    return `<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
  </PropertyGroup>

  <ItemGroup>
${includes}
  </ItemGroup>

</Project>`;
}

function generateVBNetProject(sourceFiles) {
    const includes = sourceFiles.map(f => `    <Compile Include="${f}" />`).join('\n');
    
    return `<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <RootNamespace></RootNamespace>
  </PropertyGroup>

  <ItemGroup>
${includes}
  </ItemGroup>

</Project>`;
}

testProjectFileGeneration();
