using System.Text.Json.Serialization;

public class Articulo
{
    public string Codigo { get; set; }
    public string Nombre { get; set; }
    public string SKU { get; set; }
    public string Marca { get; set; }
    public string Ubicacion { get; set; }
}

public class Comparacion
{
    public List<Articulo> Encontrados { get; set; }
    public List<Articulo> Faltantes { get; set; }

    [JsonPropertyName("no_registrados")]
    public List<Articulo> Sobrantes { get; set; }
}

