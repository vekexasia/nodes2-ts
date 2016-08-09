package com.andreabaccega;

import com.google.common.geometry.*;
import org.json.JSONArray;
import org.json.JSONObject;

import java.io.FileOutputStream;
import java.lang.reflect.Field;
import java.util.ArrayList;

import static com.google.common.geometry.S2.INVERT_MASK;
import static com.google.common.geometry.S2.SWAP_MASK;

/**
 * Created by abaccega on 09/08/16.
 */
public class CreateTests {

  static double[] latRange = new double[]{-89, 89};
  static double[] lngRange = new double[]{-179, 179};
  static int levels[] = new int[]{
    16, 15, 16, 14
  };
  static int maxTestCases = 12;
  static double totLat = latRange[1] - latRange[0];
  static double totLng = lngRange[1] - lngRange[0];



  private static JSONObject pointToJO(S2Point sPoint) {
    JSONObject jO = new JSONObject();
    jO.put("x", toJV(sPoint.get(0)));
    jO.put("y", toJV(sPoint.get(1)));
    jO.put("z", toJV(sPoint.get(2)));
    return jO;
  }

  private static JSONObject latlngToJO(S2LatLng s2LatLng) {
    JSONObject jO = new JSONObject();
    jO.put("lat", toJV(s2LatLng.latDegrees()));
    jO.put("lng", toJV(s2LatLng.lngDegrees()));
    return jO;
  }

  private static void saveJAToFile(JSONArray jA, String fname) {
    String name = System.getProperty("user.dir") + "/../test/assets/" + fname;
    System.out.println("Writing to" + name);
    try {
      FileOutputStream out = new FileOutputStream(name);
      out.write(jA.toString(2).getBytes());
      out.close();
    } catch (Exception e) {
      System.out.println(jA.toString(2));
      e.printStackTrace();
      ;
    }
  }

  private static String toJV(double d) {
    return Double.toString(d);
  }

  private static void calcLatLngTests() {

    JSONArray jA = new JSONArray();
    for (int i = 0; i < maxTestCases + 1; i++) {
      double lat = latRange[0] + (totLat / maxTestCases) * i;
      for (int j = 0; j < maxTestCases + 1; j++) {

        double lng = lngRange[0] + (totLng / maxTestCases) * j;
        S2LatLng s2LatLng = S2LatLng.fromDegrees(lat, lng);
        JSONObject tmp = new JSONObject();
        tmp.put("latR", toJV(s2LatLng.latRadians()));
        tmp.put("lngR", toJV(s2LatLng.lngRadians()));
        tmp.put("latD", toJV(s2LatLng.latDegrees()));
        tmp.put("lngD", toJV(s2LatLng.lngDegrees()));
        tmp.put("point", pointToJO(s2LatLng.toPoint()));
        tmp.put("distToCenter", toJV(s2LatLng.getDistance(S2LatLng.CENTER).radians()));
        tmp.put("distToCenterD", toJV(s2LatLng.getDistance(S2LatLng.CENTER).degrees()));
        jA.put(tmp);
      }
    }
    saveJAToFile(jA, "latlng-tests.json");

  }

  private static void calcCellsTests() {

    JSONArray jA = new JSONArray();
    for (int i = 0; i < maxTestCases + 1; i++) {
      double lat = latRange[0] + (totLat / maxTestCases) * i;
      for (int j = 0; j < maxTestCases + 1; j++) {
        double lng = lngRange[0] + (totLng / maxTestCases) * j;
        S2Cell s2Cell = new S2Cell(S2CellId.fromLatLng(S2LatLng.fromDegrees(lat, lng)));

        JSONObject tmp = new JSONObject();
        tmp.put("exactArea", toJV(s2Cell.exactArea()));
        tmp.put("center", pointToJO(s2Cell.getCenter()));
        tmp.put("v0", pointToJO(s2Cell.getVertex(0)));
        tmp.put("v1", pointToJO(s2Cell.getVertex(1)));
        tmp.put("v2", pointToJO(s2Cell.getVertex(2)));
        tmp.put("v3", pointToJO(s2Cell.getVertex(3)));


        JSONObject rectBound = new JSONObject();
        rectBound.put("latHI", toJV(s2Cell.getRectBound().latHi().degrees()));
        rectBound.put("latLO", toJV(s2Cell.getRectBound().latLo().degrees()));
        rectBound.put("lngHI", toJV(s2Cell.getRectBound().lngHi().degrees()));
        rectBound.put("lngLO", toJV(s2Cell.getRectBound().lngLo().degrees()));
        tmp.put("rectBound", rectBound);

        jA.put(tmp);
      }
    }
    saveJAToFile(jA, "cell-tests.json");

  }

  private static void calcMainTests() {

    JSONArray jA = new JSONArray();

    for (int i = 0; i < maxTestCases + 1; i++) {
      double lat = latRange[0] + (totLat / maxTestCases) * i;
      for (int j = 0; j < maxTestCases + 1; j++) {
        MutableInteger mi = new MutableInteger(0);
        MutableInteger mj = new MutableInteger(0);

        JSONObject jO = new JSONObject();

        double lng = lngRange[0] + (totLng / maxTestCases) * j;

        S2LatLng ll = new S2LatLng(S1Angle.degrees(lat), S1Angle.degrees(lng));
        S2CellId s2CellId = S2CellId.fromLatLng(
          ll
        ).parent(
          levels[(i * (maxTestCases + 1) + j) % levels.length]
        );
        S2Point s2Point = s2CellId.toPointRaw();
        S2Point s2PointNorm = S2Point.normalize(s2Point);
        jO.put("id", Long.toString(s2CellId.id()));
        jO.put("lvl", s2CellId.level());
        jO.put("face", s2CellId.face());
        jO.put("next", Long.toString(s2CellId.next().id()));
        jO.put("prev", Long.toString(s2CellId.prev().id()));
        jO.put("rangeMin", Long.toString(s2CellId.rangeMin().id()));
        jO.put("rangeMax", Long.toString(s2CellId.rangeMax().id()));
        jO.put("token", s2CellId.toToken());
        jO.put("parent", Long.toString(s2CellId.parent().id()));
        jO.put("parentLvl1", Long.toString(s2CellId.parent(1).id()));
        jO.put("pos", Long.toString(s2CellId.pos()));
        jO.put("area", Double.toString(new S2Cell(s2CellId).exactArea()));

        s2CellId.toFaceIJOrientation(mi, mj, null);
        jO.put("i", mi.intValue());
        jO.put("j", mj.intValue());

        // UV
        S2Point p = ll.toPoint();
        R2Vector uv = S2Projections.validFaceXyzToUv(s2CellId.face(), p);

        jO.put("u", Double.toString(uv.x()));
        jO.put("v", Double.toString(uv.y()));

        // ST

        jO.put("s", Double.toString(S2Projections.uvToST(uv.x())));
        jO.put("t", Double.toString(S2Projections.uvToST(uv.y())));


        S2CellId[] neighbors = new S2CellId[4];

        s2CellId.getEdgeNeighbors(neighbors);
        JSONArray neighborsJA = new JSONArray();
        for (S2CellId n : neighbors) {
          neighborsJA.put(Long.toString(n.id()));
        }
        jO.put("neighbors", neighborsJA);

        // All neighbors lvl+1
        ArrayList<S2CellId> allNeighBorsLvlPlus1 = new ArrayList<>();
        s2CellId.getAllNeighbors(s2CellId.level() + 1, allNeighBorsLvlPlus1);
        JSONArray allNeighJA = new JSONArray();
        for (S2CellId n : allNeighBorsLvlPlus1) {
          allNeighJA.put(Long.toString(n.id()));
        }
        jO.put("allNeighborsLvlP1", allNeighJA);

        JSONObject point = new JSONObject();

        point.put("x", Double.toString(s2CellId.toPoint().get(0)));
        point.put("y", Double.toString(s2CellId.toPoint().get(1)));
        point.put("z", Double.toString(s2CellId.toPoint().get(2)));
        jO.put("point", point);

        JSONObject coordsGiven = new JSONObject();
        coordsGiven.put("lat", Double.toString(lat));
        coordsGiven.put("lng", Double.toString(lng));
        jO.put("coords", coordsGiven);

        coordsGiven = new JSONObject();
        coordsGiven.put("lat", Double.toString(s2CellId.toLatLng().latDegrees()));
        coordsGiven.put("lng", Double.toString(s2CellId.toLatLng().lngDegrees()));
        jO.put("cellCoords", coordsGiven);

        jA.put(jO);
      }
    }

    saveJAToFile(jA, "main-tests.json");
  }

  public static void main(String[] args) throws IllegalAccessException, NoSuchFieldException {



    calcLatLngTests();
    calcCellsTests();
    calcMainTests();


  }

}
